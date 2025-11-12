import { apiClient } from './client.js';

export interface UploadResponse {
  success: boolean;
  data: {
    assets: Array<{
      id: string;
      productId: string;
      type: 'image' | 'video';
      url: string;
      storageKey: string;
      size: number;
      mimeType: string;
      metadata?: any;
      createdAt: string;
    }>;
  };
}

export const uploadApi = {
  uploadAssets: async (productId: string, files: File[]): Promise<UploadResponse> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return apiClient.upload<UploadResponse>(
      `/upload/products/${productId}/assets`,
      formData
    );
  },

  getAssets: async (productId: string) => {
    return apiClient.get<{
      success: boolean;
      data: { assets: any[] };
    }>(`/upload/products/${productId}/assets`);
  },

  deleteAsset: async (assetId: string) => {
    return apiClient.delete<{ success: boolean }>(`/upload/assets/${assetId}`);
  },
};

