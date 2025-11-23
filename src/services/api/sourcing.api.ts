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

  fetchSupplierContact: async (supplierName: string, city: string, country: string, website?: string) => {
    return apiClient.post<{
      success: boolean;
      data: {
        contactEmail: string;
        website?: string;
        found: boolean;
      };
    }>('/sourcing/suppliers/fetch-contact', {
      supplier_name: supplierName,
      city,
      country,
      website,
    });
  },

  getSupplier: async (supplierId: string) => {
    return apiClient.get<{
      success: boolean;
      data: { supplier: any };
    }>(`/sourcing/suppliers/${supplierId}`);
  },

  getSuppliers: async (params: {
    productId?: string;
    material?: string;
    country?: string;
    city?: string;
    minRating?: number;
    certifications?: string[];
    limit?: number;
    offset?: number;
  } = {}) => {
    // If productId is provided, fetch suppliers for that product
    if (params.productId) {
      return apiClient.get<{
        success: boolean;
        data: { suppliers: any[] };
      }>(`/sourcing/products/${params.productId}/suppliers`);
    }
    // Otherwise use search
    return sourcingApi.searchSuppliers(params);
  },
};

