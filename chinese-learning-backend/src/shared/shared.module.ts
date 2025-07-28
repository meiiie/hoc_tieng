import { Global, Module } from '@nestjs/common';
import { PinataService } from './services/pinata.service';
import { GeminiService } from './services/gemini.service';

@Global()
@Module({
  providers: [PinataService, GeminiService],
  exports: [PinataService, GeminiService],
})
export class SharedModule {}
