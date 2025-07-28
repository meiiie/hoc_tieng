import { Global, Module } from '@nestjs/common';
import { PinataService } from './services/pinata.service';
import { GeminiService } from './services/gemini.service';
import { ElevenLabsService } from './services/elevenlabs.service';

@Global()
@Module({
  providers: [PinataService, GeminiService, ElevenLabsService],
  exports: [PinataService, GeminiService, ElevenLabsService],
})
export class SharedModule {}
