import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AudioMetadata } from '../../modules/pronunciation/entities/pronunciation-attempt.entity';

export interface PinataUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

export interface PinataUploadOptions {
  pinataMetadata?: {
    name?: string;
    keyvalues?: Record<string, string>;
  };
  pinataOptions?: {
    cidVersion?: 0 | 1;
  };
}

@Injectable()
export class PinataService {
  private readonly logger = new Logger(PinataService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly pinataJWT: string;
  private readonly gatewayUrl: string;

  constructor(private configService: ConfigService) {
    this.pinataJWT = this.configService.get<string>('PINATA_JWT') || '';
    this.gatewayUrl =
      this.configService.get<string>('PINATA_GATEWAY_URL') || '';

    if (!this.pinataJWT) {
      throw new Error('PINATA_JWT is required but not provided');
    }

    if (!this.gatewayUrl) {
      throw new Error('PINATA_GATEWAY_URL is required but not provided');
    }

    this.axiosInstance = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        Authorization: `Bearer ${this.pinataJWT}`,
      },
    });

    this.logger.log('PinataService initialized successfully');
  }

  /**
   * Upload audio file to IPFS via Pinata
   * @param audioBuffer - The audio file buffer
   * @param metadata - Audio metadata
   * @param options - Pinata upload options
   * @returns Promise<PinataUploadResponse>
   */
  async uploadAudio(
    audioBuffer: Buffer,
    metadata: AudioMetadata,
    options?: PinataUploadOptions,
  ): Promise<PinataUploadResponse> {
    try {
      this.logger.log(
        `Uploading audio file to IPFS (size: ${audioBuffer.length} bytes)`,
      );

      const formData = new FormData();

      // Create blob from buffer
      const audioBlob = new Blob([audioBuffer], {
        type: `audio/${metadata.format}`,
      });

      formData.append(
        'file',
        audioBlob,
        `audio_${Date.now()}.${metadata.format}`,
      );

      // Add metadata
      const pinataMetadata = {
        name:
          options?.pinataMetadata?.name ||
          `Chinese Learning Audio ${new Date().toISOString()}`,
        keyvalues: {
          fileType: 'audio',
          format: metadata.format,
          duration: metadata.duration.toString(),
          sampleRate: metadata.sampleRate.toString(),
          size: metadata.size.toString(),
          uploadedAt: new Date().toISOString(),
          ...options?.pinataMetadata?.keyvalues,
        },
      };

      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

      if (options?.pinataOptions) {
        formData.append('pinataOptions', JSON.stringify(options.pinataOptions));
      }

      const response = await this.axiosInstance.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      this.logger.log(
        `Successfully uploaded to IPFS: ${response.data.IpfsHash}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error('Failed to upload audio to IPFS', error.stack);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * Get public URL for IPFS file
   * @param ipfsHash - The IPFS hash
   * @returns string - Public URL
   */
  getPublicUrl(ipfsHash: string): string {
    return `https://${this.gatewayUrl}/ipfs/${ipfsHash}`;
  }

  /**
   * Unpin file from IPFS (optional cleanup)
   * @param ipfsHash - The IPFS hash to unpin
   * @returns Promise<boolean>
   */
  async unpinFile(ipfsHash: string): Promise<boolean> {
    try {
      await this.axiosInstance.delete(
        `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
      );
      this.logger.log(`Successfully unpinned: ${ipfsHash}`);
      return true;
    } catch (error) {
      this.logger.warn(`Failed to unpin ${ipfsHash}:`, error.message);
      return false;
    }
  }

  /**
   * Test connection to Pinata
   * @returns Promise<boolean>
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get(
        'https://api.pinata.cloud/data/testAuthentication',
      );
      this.logger.log('Pinata connection test successful', response.data);
      return true;
    } catch (error) {
      this.logger.error('Pinata connection test failed', error.stack);
      return false;
    }
  }
}
