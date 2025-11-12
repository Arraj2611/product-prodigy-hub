import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export interface BOMGenerationRequest {
  images: Array<{
    url: string;
    storageKey: string;
  }>;
  description?: string;
  yieldBuffer?: number;
}

export interface BOMGenerationResponse {
  bom: {
    categories: Array<{
      category: string;
      items: Array<{
        name: string;
        type: string;
        quantity: number | string;
        unit: string;
        specifications?: Record<string, any>;
        source?: string;
      }>;
    }>;
    total_cost?: number;
    yield_buffer: number;
  };
  confidence: number;
  processing_time: number;
}

export class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.AI_SERVICE_URL;
  }

  async generateBOM(request: BOMGenerationRequest): Promise<BOMGenerationResponse> {
    try {
      const startTime = Date.now();

      // Download images from storage URLs
      const imageBuffers = await Promise.all(
        request.images.map(async (image) => {
          const response = await fetch(image.url);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${image.url}`);
          }
          return {
            data: Buffer.from(await response.arrayBuffer()),
            filename: image.storageKey.split('/').pop() || 'image.jpg',
            contentType: response.headers.get('content-type') || 'image/jpeg',
          };
        })
      );

      // Prepare form data for FastAPI
      const formData = new FormData();
      
      imageBuffers.forEach((img, index) => {
        const blob = new Blob([img.data], { type: img.contentType });
        formData.append('images', blob, img.filename);
      });

      if (request.description) {
        formData.append('description', request.description);
      }

      if (request.yieldBuffer !== undefined) {
        formData.append('yield_buffer', request.yieldBuffer.toString());
      }

      // Call AI service
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-bom`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(config.AI_SERVICE_API_KEY && {
            'X-API-Key': config.AI_SERVICE_API_KEY,
          }),
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result: BOMGenerationResponse = await response.json();

      const totalTime = Date.now() - startTime;
      logger.info(`BOM generation completed in ${totalTime}ms (AI service: ${result.processing_time}s)`);

      // Check if processing time exceeds target
      if (result.processing_time > 5) {
        logger.warn(`BOM generation exceeded target: ${result.processing_time}s (target: <5s)`);
      }

      return result;
    } catch (error) {
      logger.error('BOM generation error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new AppError('BOM generation timed out. Please try again.', 504);
        }
        throw new AppError(`BOM generation failed: ${error.message}`, 500);
      }
      
      throw new AppError('BOM generation failed', 500);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      logger.warn('AI service health check failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();

