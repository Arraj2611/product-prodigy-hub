import { apiClient } from './client.js';

export interface BOMItem {
  id?: string;
  category: string;
  name: string;
  type: string;
  quantity: number | string;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  specifications?: Record<string, any>;
  source?: string;
}

export interface BOM {
  id: string;
  productId: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'LOCKED';
  confidence?: number;
  totalCost?: number;
  yieldBuffer: number;
  version: number;
  lockedAt?: string;
  items: BOMItem[];
  createdAt: string;
  updatedAt: string;
}

export const bomApi = {
  generateBOM: async (productId: string, yieldBuffer?: number) => {
    return apiClient.post<{
      success: boolean;
      data: {
        bom: BOM;
        aiResult: {
          confidence: number;
          processingTime: number;
        };
      };
    }>(`/products/${productId}/boms`, { yieldBuffer });
  },

  getBOM: async (bomId: string) => {
    return apiClient.get<{
      success: boolean;
      data: { bom: BOM };
    }>(`/boms/${bomId}`);
  },

  updateBOM: async (bomId: string, data: {
    items?: BOMItem[];
    yieldBuffer?: number;
    status?: BOM['status'];
  }) => {
    return apiClient.patch<{
      success: boolean;
      data: { bom: BOM };
    }>(`/boms/${bomId}`, data);
  },

  getVersions: async (bomId: string) => {
    return apiClient.get<{
      success: boolean;
      data: { versions: any[] };
    }>(`/boms/${bomId}/versions`);
  },

  lockBOM: async (bomId: string) => {
    return apiClient.post<{
      success: boolean;
      data: { bom: BOM };
    }>(`/boms/${bomId}/lock`);
  },
};

