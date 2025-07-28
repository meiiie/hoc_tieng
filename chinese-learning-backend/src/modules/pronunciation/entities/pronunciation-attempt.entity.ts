import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export interface AnalysisResult {
  overallScore: number;
  toneAccuracy: number;
  pronunciationErrors: string[];
  suggestions: string[];
  detailedFeedback: string;
}

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  format: string;
  size: number;
}

@Entity('pronunciation_attempts')
@Index(['userId', 'createdAt'])
export class PronunciationAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ name: 'original_text', type: 'text' })
  originalText: string;

  @Column({ name: 'audio_file_url', type: 'varchar', length: 500 })
  audioFileUrl: string; // IPFS hash or URL

  @Column({ name: 'ipfs_hash', type: 'varchar', length: 100, nullable: true })
  ipfsHash: string;

  @Column({ name: 'analysis_result', type: 'jsonb' })
  analysisResult: AnalysisResult;

  @Column({ name: 'audio_metadata', type: 'jsonb', nullable: true })
  audioMetadata: AudioMetadata;

  @Column({ name: 'overall_score', type: 'decimal', precision: 3, scale: 1 })
  @Index()
  overallScore: number;

  @Column({
    name: 'processing_status',
    type: 'varchar',
    length: 20,
    default: 'pending',
  })
  @Index()
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.pronunciationAttempts)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
