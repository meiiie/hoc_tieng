import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AnalysisResult } from '../../modules/pronunciation/entities/pronunciation-attempt.entity';

export interface GeminiAnalysisRequest {
  audioUrl: string;
  originalText: string;
  userLevel?: string;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required but not provided');
    }

    this.axiosInstance = axios.create({
      timeout: 60000, // 60 seconds for AI processing
      baseURL: this.baseUrl,
    });

    this.logger.log('GeminiService initialized successfully');
  }

  /**
   * Analyze pronunciation using Gemini AI
   * @param request - Analysis request with audio URL and text
   * @returns Promise<AnalysisResult>
   */
  async analyzePronunciation(
    request: GeminiAnalysisRequest,
  ): Promise<AnalysisResult> {
    try {
      this.logger.log(
        `Starting pronunciation analysis for text: "${request.originalText}"`,
      );

      const prompt = this.buildAnalysisPrompt(request);

      const response = await this.axiosInstance.post(
        `/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent analysis
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        },
      );

      const geminiResponse: GeminiResponse = response.data;

      if (
        !geminiResponse.candidates ||
        geminiResponse.candidates.length === 0
      ) {
        throw new Error('No analysis result from Gemini');
      }

      const analysisText = geminiResponse.candidates[0].content.parts[0].text;
      return this.parseAnalysisResult(analysisText);
    } catch (error) {
      this.logger.error('Gemini pronunciation analysis failed', error.stack);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate chat response for conversation practice
   * @param message - User message
   * @param context - Optional conversation context
   * @returns Promise<string>
   */
  async generateChatResponse(
    message: string,
    context?: string,
  ): Promise<string> {
    try {
      this.logger.log(
        `Generating chat response for message: "${message.substring(0, 50)}..."`,
      );

      const prompt = this.buildChatPrompt(message, context);

      const response = await this.axiosInstance.post(
        `/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
      );

      const geminiResponse: GeminiResponse = response.data;
      return geminiResponse.candidates[0].content.parts[0].text;
    } catch (error) {
      this.logger.error('Gemini chat response failed', error.stack);
      throw new Error(`Chat generation failed: ${error.message}`);
    }
  }

  /**
   * Build analysis prompt for pronunciation evaluation
   */
  private buildAnalysisPrompt(request: GeminiAnalysisRequest): string {
    return `
    You are a professional Chinese pronunciation teacher. Analyze the pronunciation of this Chinese text and provide detailed feedback.

    **Original Text (Chinese):** ${request.originalText}
    **Audio URL:** ${request.audioUrl}
    **Student Level:** ${request.userLevel || 'Beginner'}

    Please provide your analysis in the following JSON format:
    {
      "overallScore": <number between 0-100>,
      "toneAccuracy": <number between 0-100>,
      "pronunciationErrors": [<array of specific errors found>],
      "suggestions": [<array of improvement suggestions>],
      "detailedFeedback": "<detailed explanation in Vietnamese>"
    }

    Focus on:
    1. Tone accuracy (声调) - This is crucial for Chinese
    2. Consonant and vowel pronunciation
    3. Rhythm and stress patterns
    4. Common mistakes Vietnamese speakers make with Chinese

    Provide constructive feedback in Vietnamese language that helps the student improve.
    `;
  }

  /**
   * Build chat prompt for conversation practice
   */
  private buildChatPrompt(message: string, context?: string): string {
    return `
    You are a friendly Chinese conversation partner helping a Vietnamese student practice Chinese.
    
    ${context ? `Previous context: ${context}` : ''}
    
    Student says: "${message}"
    
    Respond naturally in Chinese (Simplified), keeping the conversation engaging and educational.
    If the student makes mistakes, gently correct them and provide the right way to say it.
    Adjust your language level to match the student's proficiency.
    
    Keep responses conversational and not too long (2-3 sentences max).
    `;
  }

  /**
   * Parse Gemini's analysis result into structured format
   */
  private parseAnalysisResult(analysisText: string): AnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate required fields
        return {
          overallScore: Math.max(0, Math.min(100, parsed.overallScore || 0)),
          toneAccuracy: Math.max(0, Math.min(100, parsed.toneAccuracy || 0)),
          pronunciationErrors: Array.isArray(parsed.pronunciationErrors)
            ? parsed.pronunciationErrors
            : [],
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions
            : [],
          detailedFeedback:
            parsed.detailedFeedback || 'Không có phản hồi chi tiết.',
        };
      }
    } catch (error) {
      this.logger.warn(
        'Failed to parse structured analysis, using fallback',
        error.message,
      );
    }

    // Fallback: create basic analysis from text
    return {
      overallScore: 75, // Default moderate score
      toneAccuracy: 70,
      pronunciationErrors: ['Không thể phân tích chi tiết'],
      suggestions: ['Hãy thử lại với âm thanh rõ ràng hơn'],
      detailedFeedback: analysisText.substring(0, 500),
    };
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post(
        `/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: 'Hello, please respond with "Connection successful"',
                },
              ],
            },
          ],
        },
      );

      this.logger.log('Gemini connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Gemini connection test failed', error.stack);
      return false;
    }
  }
}
