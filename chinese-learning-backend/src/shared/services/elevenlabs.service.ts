import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Interface định nghĩa cấu trúc dữ liệu cần thiết để gọi API.
 * Giúp mã nguồn rõ ràng và an toàn về kiểu dữ liệu.
 */
export interface TTSRequest {
  text: string;
  voiceId: string;
  modelId: string;
}

@Injectable()
export class ElevenLabsService {
  // Logger giúp ghi lại các hoạt động và lỗi một cách chuyên nghiệp.
  private readonly logger = new Logger(ElevenLabsService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(private configService: ConfigService) {
    // Lấy API key từ file .env ra một biến tạm.
    const apiKeyFromEnv = this.configService.get<string>('ELEVENLABS_API_KEY');

    // Sửa lỗi: Kiểm tra sự tồn tại của API key.
    // Nếu key không được định nghĩa, ứng dụng sẽ dừng lại với một lỗi rõ ràng.
    if (!apiKeyFromEnv) {
      throw new Error('ELEVENLABS_API_KEY is not defined in the .env file');
    }

    // Nếu key tồn tại, gán nó vào thuộc tính của class.
    this.apiKey = apiKeyFromEnv;
  }

  /**
   * Hàm chung để tạo giọng nói từ văn bản.
   * Nó không chứa logic cho bất kỳ ngôn ngữ cụ thể nào, giúp dễ dàng tái sử dụng.
   * @returns Buffer chứa dữ liệu audio MP3.
   */
  async generateSpeech(request: TTSRequest): Promise<Buffer> {
    const { text, voiceId, modelId } = request;

    this.logger.log(`Generating speech with model [${modelId}] and voice [${voiceId}]...`);

    try {
      // Thực hiện gọi API đến ElevenLabs bằng axios
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          // Yêu cầu axios trả về dữ liệu dạng 'arraybuffer' để xử lý file.
          responseType: 'arraybuffer',
        },
      );

      // Chuyển đổi dữ liệu nhận được thành Buffer của Node.js
      return Buffer.from(response.data);
    } catch (error) {
      // Ghi lại lỗi chi tiết để gỡ lỗi nếu có sự cố.
      this.logger.error(`Failed to generate speech. Status: ${error.response?.status}`, error.response?.data?.detail || error.message);
      throw new InternalServerErrorException('Failed to generate speech from ElevenLabs');
    }
  }
}