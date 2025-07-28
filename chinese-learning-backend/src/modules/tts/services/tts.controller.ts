import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
// Sửa đường dẫn import cho đúng với cấu trúc của bạn
import { ElevenLabsService } from '../../../shared/services/elevenlabs.service';

interface VietnameseTTSPayload {
  text: string;
}

@Controller('tts')
export class TtsController { // <-- Đảm bảo có 'export' và tên đúng
  // Cấu hình cho giọng nam "Arnold"
  private readonly VIETNAMESE_MODEL_ID = 'eleven_turbo_v2_5';
  private readonly VIETNAMESE_VOICE_ID = 'VkftF4RyfVI5yIYa6wFa'; 

  // Controller chỉ cần inject service, không cần tự lấy API key
  constructor(private readonly elevenLabsService: ElevenLabsService) {}

  @Post('vietnamese')
  async vietnameseTTS(
    @Body() payload: VietnameseTTSPayload,
    @Res() res: Response,
  ) {
    try {
      if (!payload.text || payload.text.trim().length === 0) {
        throw new HttpException('Text is required', HttpStatus.BAD_REQUEST);
      }

      console.log(`[Vietnamese TTS] Request received for text: "${payload.text.substring(0, 50)}..."`);
      console.log(`[Vietnamese TTS] Using Model: ${this.VIETNAMESE_MODEL_ID}, Voice: ${this.VIETNAMESE_VOICE_ID}`);

      const audioBuffer = await this.elevenLabsService.generateSpeech({
        text: payload.text,
        modelId: this.VIETNAMESE_MODEL_ID,
        voiceId: this.VIETNAMESE_VOICE_ID,
      });

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="vietnamese_speech.mp3"`,
      });

      res.send(audioBuffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('TTS generation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}