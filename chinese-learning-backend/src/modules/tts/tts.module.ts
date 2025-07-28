import { Module } from '@nestjs/common';
import { TtsController } from './services/tts.controller';
import { ElevenLabsService } from '../../shared/services/elevenlabs.service';

@Module({
  controllers: [TtsController],
  providers: [ElevenLabsService],
  exports: [ElevenLabsService],
})
export class TtsModule {}