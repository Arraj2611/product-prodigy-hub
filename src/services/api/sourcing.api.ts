import { apiClient } from './client.js';

export const sourcingApi = {
  getCommodityPrice: async (commodity: string, date?: string) => {
    const params = new URLSearchParams({ commodity });
    if (date) params.append('date', date);
    return apiClient.get<{
      success: boolean;
      data: {
        price: number;
        currency: string;
        date: string;
        source: string;
        volatility?: number;
      };
    }>(`/sourcing/commodities/prices?${params.toString()}`);
  },

  getPriceHistory: async (commodity: string, days: number = 90) => {
    return apiClient.get<{
      success: boolean;
      data: { prices: Array<{ date: string; price: number }> };
    }>(`/sourcing/commodities/history?commodity=${commodity}&days=${days}`);
  },

  searchSuppliers: async (params: {
    material?: string;
    country?: string;
    city?: string;
    minRating?: number;
    certifications?: string[];
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    return apiClient.get<{
      success: boolean;
      data: { suppliers: any[] };
    }>(`/sourcing/suppliers?${queryParams.toString()}`);
  },

  rankSuppliers: async (material: string, quantity: number, unit: string) => {
    return apiClient.get<{
      success: boolean;
      data: {
        rankings: Array<{
          supplier: any;
          score: number;
          reasons: string[];
        }>;
      };
    }>(`/sourcing/suppliers/rank?material=${material}&quantity=${quantity}&unit=${unit}`);
  },

  getSupplier: async (supplierId: string) => {
    return apiClient.get<{
      success: boolean;
      data: { supplier: any };
    }>(`/sourcing/suppliers/${supplierId}`);
  },
};

