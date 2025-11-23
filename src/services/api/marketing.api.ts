import { apiClient } from './client.js';

export interface MarketingCampaign {
  platform: string;
  name: string;
  budget: string;
  reach: string;
  engagement: string;
  roi: string;
  status: string;
  progress: number;
}

export const marketingApi = {
  getCampaigns: async (productId?: string) => {
    if (productId) {
      return apiClient.get<{
        success: boolean;
        data: { campaigns: MarketingCampaign[] };
      }>(`/marketing/products/${productId}/campaigns`);
    }
    return apiClient.get<{
      success: boolean;
      data: { campaigns: MarketingCampaign[] };
    }>('/marketing/campaigns');
  },
};

