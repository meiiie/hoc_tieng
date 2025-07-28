import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PronunciationAttempt } from './entities/pronunciation-attempt.entity';
import { User } from '../user/entities/user.entity';
// TODO: Implement these services & controllers
// import { PronunciationService } from './services/pronunciation.service';
// import { PronunciationController } from './controllers/pronunciation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PronunciationAttempt, User])],
  providers: [
    // PronunciationService
  ],
  controllers: [
    // PronunciationController
  ],
  exports: [
    // PronunciationService
  ],
})
export class PronunciationModule {}
