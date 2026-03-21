import type { CampaignSummary } from '@/entities/campaign';
import { MOCK_CAMPAIGNS } from '../mockData/campaigns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const campaignRepository = {
  list: async (): Promise<CampaignSummary[]> => {
    if (USE_MOCK) {
      await delay(300);
      return MOCK_CAMPAIGNS;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<CampaignSummary[]>('/campaigns');
  },

  getById: async (id: string): Promise<CampaignSummary> => {
    if (USE_MOCK) {
      await delay(200);
      const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id);
      if (!campaign) throw new Error(`Campaign not found: ${id}`);
      return campaign;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<CampaignSummary>(`/campaigns/${id}`);
  },
};
