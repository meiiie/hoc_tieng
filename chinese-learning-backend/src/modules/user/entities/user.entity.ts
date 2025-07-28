import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { PronunciationAttempt } from '../../pronunciation/entities/pronunciation-attempt.entity';

export enum ChineseLevel {
  HSK1 = 'HSK1',
  HSK2 = 'HSK2',
  HSK3 = 'HSK3',
  HSK4 = 'HSK4',
  HSK5 = 'HSK5',
  HSK6 = 'HSK6',
  NATIVE = 'NATIVE',
}

export interface UserPreferences {
  preferredVoice: 'male' | 'female';
  studyGoals: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  practiceFrequency: 'daily' | 'weekly' | 'monthly';
}

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  displayName: string;

  @Column({
    type: 'enum',
    enum: ChineseLevel,
    default: ChineseLevel.HSK1,
  })
  level: ChineseLevel;

  @Column({ type: 'jsonb', nullable: true })
  preferences: UserPreferences;

  @Column({ name: 'total_attempts', type: 'int', default: 0 })
  totalAttempts: number;

  @Column({
    name: 'average_score',
    type: 'decimal',
    precision: 3,
    scale: 1,
    nullable: true,
  })
  averageScore: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => PronunciationAttempt, (attempt) => attempt.userId)
  pronunciationAttempts: PronunciationAttempt[];
}
