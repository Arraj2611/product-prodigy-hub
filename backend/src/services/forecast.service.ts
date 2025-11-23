import { config } from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export interface MarketForecastRequest {
  product_name: string;
  product_description?: string;
  bom_materials: string[];
  target_markets?: string[];
}

export interface MarketForecastResponse {
  forecasts: Array<{
    country: string;
    city: string;
    demand: number;
    competition: number;
    price: number;
    growth: number;
    marketSize?: string;
    avgPrice?: string;
    growthPercent?: string;
    trend?: string;
  }>;
}

export interface PriceForecastRequest {
  material_name: string;
  material_type: string;
  unit: string;
  weeks?: number;
}

export interface PriceForecastResponse {
  forecasts: Array<{
    week: number;
    price: number;
  }>;
}

export interface SupplierRequest {
  material_name: string;
  material_type: string;
  quantity: number;
  unit: string;
  preferred_countries?: string[];
}

export interface SupplierResponse {
  suppliers: Array<{
    name: string;
    country: string;
    city: string;
    coordinates: [number, number];
    unitPrice: number;
    moq: string;
    leadTime: string;
    rating: number;
    reliability: number;
    certifications: string[];
    website?: string;
    contactEmail?: string;
  }>;
}

export class ForecastService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.AI_SERVICE_URL;
  }

  async generateMarketForecast(request: MarketForecastRequest): Promise<MarketForecastResponse> {
    try {
      logger.info(`Generating market forecast for product: ${request.product_name}`);
      
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-market-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000), // Increased to 30 seconds for comprehensive market analysis
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error(`Market forecast API error: ${error}`);
        throw new Error(`Market forecast error: ${error}`);
      }

      const result = await response.json() as any;
      const forecasts = result.data?.forecasts || result.forecasts || [];
      
      if (forecasts.length === 0) {
        logger.warn(`No market forecasts returned for product: ${request.product_name}`);
      } else {
        logger.info(`Market forecast generated: ${forecasts.length} markets found for product: ${request.product_name}`);
      }
      
      return { forecasts };
    } catch (error) {
      logger.error('Market forecast generation error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new AppError('Market forecast generation timed out', 504);
        }
        throw new AppError(`Market forecast failed: ${error.message}`, 500);
      }
      throw new AppError('Market forecast failed', 500);
    }
  }

  async generatePriceForecast(request: PriceForecastRequest): Promise<PriceForecastResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-price-forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Price forecast error: ${error}`);
      }

      const result = await response.json() as any;
      return result.data || { forecasts: [] };
    } catch (error) {
      logger.error('Price forecast generation error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new AppError('Price forecast generation timed out', 504);
        }
        throw new AppError(`Price forecast failed: ${error.message}`, 500);
      }
      throw new AppError('Price forecast failed', 500);
    }
  }

  async generateSuppliers(request: SupplierRequest): Promise<SupplierResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/ai/generate-suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supplier generation error: ${error}`);
      }

      const result = await response.json() as any;
      return result.data || { suppliers: [] };
    } catch (error) {
      logger.error('Supplier generation error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          throw new AppError('Supplier generation timed out', 504);
        }
        throw new AppError(`Supplier generation failed: ${error.message}`, 500);
      }
      throw new AppError('Supplier generation failed', 500);
    }
  }
}

export const forecastService = new ForecastService();

