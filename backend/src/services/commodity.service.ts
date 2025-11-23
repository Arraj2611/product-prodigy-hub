import { config } from '../config/index.js';
import redisClient from '../config/redis.js';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Reserved for future FRED API integration
interface FREDSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
  observations: Array<{
    date: string;
    value: string;
  }>;
}

// FRED API series IDs for textile commodities
const FRED_SERIES = {
  COTTON: 'PCOTTINDUSDM', // Cotton Price Index
  POLYESTER: 'PPOLYINDUSDM', // Polyester Price Index (if available)
};

const CACHE_TTL = 3600; // 1 hour cache

export class CommodityService {
  private apiKey: string;

  constructor() {
    this.apiKey = config.FRED_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('FRED API key not configured');
    }
  }

  async getCommodityPrice(
    commodity: string,
    date?: Date
  ): Promise<{
    price: number;
    currency: string;
    date: string;
    source: string;
    volatility?: number;
  }> {
    const cacheKey = `commodity:${commodity}:${date?.toISOString().split('T')[0] || 'latest'}`;

    // Check cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache read error:', error);
    }

    // Fetch from FRED API
    let priceData;
    try {
      priceData = await this.fetchFromFRED(commodity, date);
    } catch (error) {
      logger.error(`FRED API error for ${commodity}:`, error);
      // Fallback to database
      priceData = await this.getFromDatabase(commodity, date);
    }

    if (!priceData) {
      throw new AppError(`Commodity price not found for: ${commodity}`, 404);
    }

    // Cache the result
    try {
      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(priceData));
    } catch (error) {
      logger.warn('Redis cache write error:', error);
    }

    return priceData;
  }

  private async fetchFromFRED(
    commodity: string,
    date?: Date
  ): Promise<{
    price: number;
    currency: string;
    date: string;
    source: string;
    volatility?: number;
  } | null> {
    if (!this.apiKey) {
      throw new Error('FRED API key not configured');
    }

    const seriesId = this.getFREDSeriesId(commodity);
    if (!seriesId) {
      return null;
    }

    const endDate = date || new Date();
    const startDate = new Date(endDate);
    startDate.setFullYear(startDate.getFullYear() - 1); // 1 year of history

    const url = new URL('https://api.stlouisfed.org/fred/series/observations');
    url.searchParams.set('series_id', seriesId);
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('observation_start', startDate.toISOString().split('T')[0]);
    url.searchParams.set('observation_end', endDate.toISOString().split('T')[0]);
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const observations = data.observations || [];

    if (observations.length === 0) {
      return null;
    }

    const latest = observations[0];
    const price = parseFloat(latest.value);

    if (isNaN(price)) {
      return null;
    }

    // Calculate volatility from historical data
    const volatility = await this.calculateVolatility(seriesId, endDate);

    const result = {
      price,
      currency: 'USD',
      date: latest.date,
      source: 'FRED',
      volatility,
    };

    // Save to database
    await this.saveToDatabase(commodity, result);

    return result;
  }

  private async calculateVolatility(seriesId: string, endDate: Date): Promise<number> {
    try {
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 90); // 90 days

      const url = new URL('https://api.stlouisfed.org/fred/series/observations');
      url.searchParams.set('series_id', seriesId);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('file_type', 'json');
      url.searchParams.set('observation_start', startDate.toISOString().split('T')[0]);
      url.searchParams.set('observation_end', endDate.toISOString().split('T')[0]);

      const response = await fetch(url.toString());
      if (!response.ok) {
        return 0;
      }

      const data = await response.json() as any;
      const observations = data.observations || [];

      if (observations.length < 2) {
        return 0;
      }

      const prices = observations
        .map((obs: any) => parseFloat(obs.value))
        .filter((p: number) => !isNaN(p));

      if (prices.length < 2) {
        return 0;
      }

      // Calculate standard deviation as volatility measure
      const mean = prices.reduce((a: number, b: number) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum: number, price: number) => {
        return sum + Math.pow(price - mean, 2);
      }, 0) / prices.length;
      const stdDev = Math.sqrt(variance);

      // Return as percentage
      return (stdDev / mean) * 100;
    } catch (error) {
      logger.warn('Volatility calculation error:', error);
      return 0;
    }
  }

  private getFREDSeriesId(commodity: string): string | null {
    const upper = commodity.toUpperCase();
    if (upper.includes('COTTON')) {
      return FRED_SERIES.COTTON;
    }
    if (upper.includes('POLYESTER') || upper.includes('POLY')) {
      return FRED_SERIES.POLYESTER;
    }
    return null;
  }

  private async getFromDatabase(
    commodity: string,
    date?: Date
  ): Promise<{
    price: number;
    currency: string;
    date: string;
    source: string;
  } | null> {
    const price = await prisma.commodityPrice.findFirst({
      where: {
        commodity: {
          contains: commodity,
          mode: 'insensitive',
        },
        date: date ? { lte: date } : undefined,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (!price) {
      return null;
    }

    return {
      price: Number(price.unitPrice),
      currency: price.currency,
      date: price.date.toISOString().split('T')[0],
      source: price.source,
    };
  }

  private async saveToDatabase(
    commodity: string,
    priceData: {
      price: number;
      currency: string;
      date: string;
      source: string;
      volatility?: number;
    }
  ): Promise<void> {
    try {
      await prisma.commodityPrice.create({
        data: {
          commodity,
          unitPrice: priceData.price,
          unit: 'per_unit',
          currency: priceData.currency,
          source: priceData.source,
          date: new Date(priceData.date),
          volatility: priceData.volatility,
        },
      });
    } catch (error) {
      logger.warn('Failed to save commodity price to database:', error);
    }
  }

  async getHistoricalPrices(
    commodity: string,
    days: number = 90
  ): Promise<Array<{ date: string; price: number }>> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const prices = await prisma.commodityPrice.findMany({
      where: {
        commodity: {
          contains: commodity,
          mode: 'insensitive',
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return prices.map((p) => ({
      date: p.date.toISOString().split('T')[0],
      price: Number(p.unitPrice),
    }));
  }
}

export const commodityService = new CommodityService();

