import { apiClient } from './client.js';

export interface MarketForecast {
  id: string;
  productId: string;
  bomId?: string;
  country: string;
  city?: string;
  demand: number;
  competition: number;
  price: number;
  growth: number;
  marketSize?: string;
  avgPrice?: string;
  growthPercent?: string;
  trend?: string;
  forecastDate: string;
}

export interface PriceForecast {
  week: number;
  price: number;
}

export const analyticsApi = {
  getMarketForecasts: async (productId?: string) => {
    if (productId) {
      return apiClient.get<{
        success: boolean;
        data: { forecasts: MarketForecast[] };
      }>(`/analytics/products/${productId}/market-forecasts`);
    }
    return apiClient.get<{
      success: boolean;
      data: { forecasts: MarketForecast[] };
    }>('/analytics/market-forecasts');
  },

  getPriceForecasts: async (productId?: string, material?: string) => {
    if (productId) {
      return apiClient.get<{
        success: boolean;
        data: { forecasts: Record<string, PriceForecast[]> };
      }>(`/analytics/products/${productId}/price-forecasts`);
    }
    const params = material ? `?material=${material}` : '';
    return apiClient.get<{
      success: boolean;
      data: { forecasts: Record<string, PriceForecast[]> };
    }>(`/analytics/price-forecasts${params}`);
  },

  getRevenueProjection: async (productId: string) => {
    return apiClient.get<{
      success: boolean;
      data: {
        projections: Array<{
          month: string;
          revenue: number;
          cost: number;
          profit: number;
          units: number;
          avgPrice: number;
        }>;
      };
    }>(`/analytics/products/${productId}/revenue-projection`);
  },

  getProductPerformance: async () => {
    return apiClient.get<{
      success: boolean;
      data: {
        performance: Array<{
          product: string;
          sales: number;
          revenue: number;
          margin: number;
        }>;
      };
    }>('/analytics/product-performance');
  },
};

