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

      // Download images from storage URLs or local files
      const imageBuffers = await Promise.all(
        request.images.map(async (image) => {
          let data: Buffer;
          let contentType: string;

          // Check if it's a local file path
          if (image.url.startsWith('/uploads/') || image.storageKey) {
            const fs = await import('fs/promises');
            const path = await import('path');
            const { config } = await import('../config/index.js');
            
            // Read from local file system
            const filePath = path.resolve(
              config.STORAGE_LOCAL_PATH || './uploads',
              image.storageKey || image.url.replace('/uploads/', '')
            );
            
            data = await fs.readFile(filePath);
            
            // Determine content type from file extension
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
            };
            contentType = mimeTypes[ext] || 'image/jpeg';
          } else {
            // Fetch from URL (cloud storage)
            const response = await fetch(image.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${image.url}`);
            }
            data = Buffer.from(await response.arrayBuffer());
            contentType = response.headers.get('content-type') || 'image/jpeg';
          }

          return {
            data,
            filename: image.storageKey.split('/').pop() || 'image.jpg',
            contentType,
          };
        })
      );

      // Prepare form data for FastAPI
      const formData = new FormData();
      
      imageBuffers.forEach((img) => {
        const blob = new Blob([img.data], { type: img.contentType });
        formData.append('images', blob, img.filename);
      });

      if (request.description) {
        formData.append('description', request.description);
      }

      if (request.yieldBuffer !== undefined) {
        formData.append('yield_buffer', request.yieldBuffer.toString());
      }

      // Call AI service with increased timeout for complex analysis
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-bom`, {
        method: 'POST',
        body: formData,
        headers: {
          ...(config.AI_SERVICE_API_KEY && {
            'X-API-Key': config.AI_SERVICE_API_KEY,
          }),
        },
        signal: AbortSignal.timeout(120000), // 2 minute timeout for complex analysis
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json() as BOMGenerationResponse;

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

  async generateRevenueProjection(request: {
    product_name: string;
    product_description: string;
    bom_cost: number;
    target_markets?: string[];
  }): Promise<{ projections: Array<{ month: string; revenue: number; cost: number; profit: number; units: number; avgPrice: number }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-revenue-projection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.AI_SERVICE_API_KEY && {
            'X-API-Key': config.AI_SERVICE_API_KEY,
          }),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json() as any;
      return result.data || { projections: [] };
    } catch (error) {
      logger.error('Revenue projection generation error:', error);
      throw new AppError('Revenue projection generation failed', 500);
    }
  }

  async generateProductPerformance(request: {
    products: Array<{ name: string; description: string; status: string }>;
  }): Promise<{ performance: Array<{ product: string; sales: number; revenue: number; margin: number }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-product-performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.AI_SERVICE_API_KEY && {
            'X-API-Key': config.AI_SERVICE_API_KEY,
          }),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json() as any;
      return result.data || { performance: [] };
    } catch (error) {
      logger.error('Product performance generation error:', error);
      throw new AppError('Product performance generation failed', 500);
    }
  }

  async generateMarketingCampaigns(request: {
    product_name: string;
    product_description: string;
    target_markets?: string[];
  }): Promise<{ campaigns: Array<{ platform: string; name: string; budget: string; reach: string; engagement: string; roi: string; status: string; progress: number }> }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-marketing-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.AI_SERVICE_API_KEY && {
            'X-API-Key': config.AI_SERVICE_API_KEY,
          }),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json() as any;
      return result.data || { campaigns: [] };
    } catch (error) {
      logger.error('Marketing campaign generation error:', error);
      throw new AppError('Marketing campaign generation failed', 500);
    }
  }

  async fetchSupplierContact(request: {
    supplier_name: string;
    city: string;
    country: string;
    website?: string;
  }): Promise<{ contactEmail: string; website?: string; found: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/fetch-supplier-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.AI_SERVICE_API_KEY && {
            'X-API-Key': config.AI_SERVICE_API_KEY,
          }),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI service error: ${error}`);
      }

      const result = await response.json() as any;
      return result.data || { contactEmail: '', found: false };
    } catch (error) {
      logger.error('Supplier contact fetch error:', error);
      throw new AppError('Supplier contact fetch failed', 500);
    }
  }
}

export const aiService = new AIService();

