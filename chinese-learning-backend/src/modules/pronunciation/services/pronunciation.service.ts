import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PronunciationAttempt,
  AudioMetadata,
  AnalysisResult,
} from '../entities/pronunciation-attempt.entity';
import { User } from '../../user/entities/user.entity';
import { PinataService } from '../../../shared/services/pinata.service';
import { GeminiService } from '../../../shared/services/gemini.service';

export interface CreatePronunciationAttemptRequest {
  userId?: string;
  originalText: string;
  audioBuffer: Buffer;
  audioMetadata: AudioMetadata;
}

export interface PronunciationAnalysisResponse {
  id: string;
  originalText: string;
  audioFileUrl: string;
  analysisResult: AnalysisResult;
  overallScore: number;
  processingStatus: string;
  createdAt: Date;
}

@Injectable()
export class PronunciationService {
  private readonly logger = new Logger(PronunciationService.name);

  constructor(
    @InjectRepository(PronunciationAttempt)
    private pronunciationRepository: Repository<PronunciationAttempt>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private pinataService: PinataService,
    private geminiService: GeminiService,
  ) {}

  /**
   * Main orchestration method - handles complete pronunciation analysis workflow
   */
  async analyzePronunciation(
    request: CreatePronunciationAttemptRequest,
  ): Promise<PronunciationAnalysisResponse> {
    this.logger.log(
      `Starting pronunciation analysis for text: "${request.originalText}"`,
    );

    // Step 1: Create initial database record with 'pending' status
    const attempt = await this.createInitialAttempt(request);

    try {
      // Step 2: Update status to 'processing'
      await this.updateProcessingStatus(attempt.id, 'processing');

      // Step 3: Upload audio file to IPFS
      const ipfsResult = await this.uploadAudioToIPFS(
        request.audioBuffer,
        request.audioMetadata,
        attempt.id,
      );

      // Step 4: Update attempt with IPFS information
      await this.updateAttemptWithIPFS(attempt.id, ipfsResult);

      // Step 5: Analyze pronunciation using AI
      const analysisResult = await this.performAIAnalysis(
        ipfsResult.audioUrl,
        request.originalText,
        request.userId,
      );

      // Step 6: Save final results and update status
      const finalAttempt = await this.finalizeAnalysis(
        attempt.id,
        analysisResult,
      );

      // Step 7: Update user statistics (if user exists)
      if (request.userId) {
        await this.updateUserStatistics(
          request.userId,
          analysisResult.overallScore,
        );
      }

      this.logger.log(
        `Pronunciation analysis completed successfully for attempt: ${attempt.id}`,
      );

      return this.mapToResponse(finalAttempt);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Pronunciation analysis failed for attempt: ${attempt.id}`,
        error instanceof Error ? error.stack : errorMessage,
      );

      // Update status to 'failed' with error message
      await this.updateProcessingStatus(attempt.id, 'failed', errorMessage);

      throw error;
    }
  }

  /**
   * Get pronunciation attempt by ID
   */
  async getPronunciationAttempt(
    id: string,
  ): Promise<PronunciationAnalysisResponse> {
    const attempt = await this.pronunciationRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!attempt) {
      throw new Error(`Pronunciation attempt with ID ${id} not found`);
    }

    return this.mapToResponse(attempt);
  }

  /**
   * Get user's pronunciation attempts with pagination
   */
  async getUserPronunciationAttempts(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    attempts: PronunciationAnalysisResponse[];
    total: number;
    totalPages: number;
  }> {
    const [attempts, total] = await this.pronunciationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return {
      attempts: attempts.map((attempt) => this.mapToResponse(attempt)),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user pronunciation statistics
   */
  async getUserStatistics(userId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    recentImprovement: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const attempts = await this.pronunciationRepository.find({
      where: { userId, processingStatus: 'completed' },
      order: { createdAt: 'DESC' },
      take: 10, // Last 10 attempts for improvement calculation
    });

    const bestScore = Math.max(...attempts.map((a) => a.overallScore), 0);

    // Calculate recent improvement (last 5 vs previous 5)
    const recent5 = attempts.slice(0, 5);
    const previous5 = attempts.slice(5, 10);

    const recentAvg =
      recent5.length > 0
        ? recent5.reduce((sum, a) => sum + a.overallScore, 0) / recent5.length
        : 0;

    const previousAvg =
      previous5.length > 0
        ? previous5.reduce((sum, a) => sum + a.overallScore, 0) /
          previous5.length
        : recentAvg;

    return {
      totalAttempts: user.totalAttempts,
      averageScore: user.averageScore || 0,
      bestScore,
      recentImprovement: recentAvg - previousAvg,
    };
  }

  /**
   * Private helper methods
   */

  private async createInitialAttempt(
    request: CreatePronunciationAttemptRequest,
  ): Promise<PronunciationAttempt> {
    const attempt = this.pronunciationRepository.create({
      userId: request.userId,
      originalText: request.originalText,
      audioMetadata: request.audioMetadata,
      processingStatus: 'pending',
      audioFileUrl: '', // Will be updated after IPFS upload
      ipfsHash: '', // Will be updated after IPFS upload
      analysisResult: {
        overallScore: 0,
        toneAccuracy: 0,
        pronunciationErrors: [],
        suggestions: [],
        detailedFeedback: '',
      },
      overallScore: 0,
    });

    return await this.pronunciationRepository.save(attempt);
  }

  private async updateProcessingStatus(
    attemptId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string,
  ): Promise<void> {
    await this.pronunciationRepository.update(attemptId, {
      processingStatus: status,
      errorMessage: errorMessage || undefined,
    });

    this.logger.log(`Updated attempt ${attemptId} status to: ${status}`);
  }

  private async uploadAudioToIPFS(
    audioBuffer: Buffer,
    metadata: AudioMetadata,
    attemptId: string,
  ): Promise<{ ipfsHash: string; audioUrl: string }> {
    try {
      const uploadResult = await this.pinataService.uploadAudio(
        audioBuffer,
        metadata,
        {
          pinataMetadata: {
            name: `Pronunciation Analysis ${attemptId}`,
            keyvalues: {
              attemptId,
              originalDuration: metadata.duration.toString(),
              analysisType: 'pronunciation',
            },
          },
        },
      );

      const audioUrl = this.pinataService.getPublicUrl(uploadResult.IpfsHash);

      return {
        ipfsHash: uploadResult.IpfsHash,
        audioUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `IPFS upload failed for attempt ${attemptId}`,
        error instanceof Error ? error.stack : errorMessage,
      );
      throw new Error(`Failed to upload audio file: ${errorMessage}`);
    }
  }

  private async updateAttemptWithIPFS(
    attemptId: string,
    ipfsResult: { ipfsHash: string; audioUrl: string },
  ): Promise<void> {
    await this.pronunciationRepository.update(attemptId, {
      ipfsHash: ipfsResult.ipfsHash,
      audioFileUrl: ipfsResult.audioUrl,
    });

    this.logger.log(
      `Updated attempt ${attemptId} with IPFS hash: ${ipfsResult.ipfsHash}`,
    );
  }

  private async performAIAnalysis(
    audioUrl: string,
    originalText: string,
    userId?: string,
  ): Promise<AnalysisResult> {
    try {
      // Get user level for personalized analysis
      let userLevel = 'Beginner';
      if (userId) {
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (user) {
          userLevel = user.level;
        }
      }

      const analysisResult = await this.geminiService.analyzePronunciation({
        audioUrl,
        originalText,
        userLevel,
      });

      return analysisResult;
    } catch (error) {
      this.logger.error(
        `AI analysis failed for audio: ${audioUrl}`,
        error.stack,
      );
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private async finalizeAnalysis(
    attemptId: string,
    analysisResult: AnalysisResult,
  ): Promise<PronunciationAttempt> {
    await this.pronunciationRepository.update(attemptId, {
      analysisResult,
      overallScore: analysisResult.overallScore,
      processingStatus: 'completed',
    });

    const finalAttempt = await this.pronunciationRepository.findOne({
      where: { id: attemptId },
      relations: ['user'],
    });

    if (!finalAttempt) {
      throw new Error(`Failed to retrieve finalized attempt: ${attemptId}`);
    }

    return finalAttempt;
  }

  private async updateUserStatistics(
    userId: string,
    newScore: number,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping statistics update`);
      return;
    }

    const newTotalAttempts = user.totalAttempts + 1;
    const currentAverage = user.averageScore || 0;

    // Calculate new average score
    const newAverageScore =
      (currentAverage * user.totalAttempts + newScore) / newTotalAttempts;

    await this.userRepository.update(userId, {
      totalAttempts: newTotalAttempts,
      averageScore: Math.round(newAverageScore * 10) / 10, // Round to 1 decimal place
    });

    this.logger.log(
      `Updated statistics for user ${userId}: ${newTotalAttempts} attempts, avg: ${newAverageScore}`,
    );
  }

  private mapToResponse(
    attempt: PronunciationAttempt,
  ): PronunciationAnalysisResponse {
    return {
      id: attempt.id,
      originalText: attempt.originalText,
      audioFileUrl: attempt.audioFileUrl,
      analysisResult: attempt.analysisResult,
      overallScore: attempt.overallScore,
      processingStatus: attempt.processingStatus,
      createdAt: attempt.createdAt,
    };
  }
}
