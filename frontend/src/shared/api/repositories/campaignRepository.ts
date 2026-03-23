import type { CampaignSummary } from '@/entities/campaign';
import { MOCK_CAMPAIGNS } from '../mockData/campaigns';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STORAGE_KEY = 'ttrpg_campaigns';
const STORAGE_VERSION = '1';

function load(): CampaignSummary[] {
  const version = localStorage.getItem(`${STORAGE_KEY}_version`);
  if (version !== STORAGE_VERSION) {
    const existing: CampaignSummary[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const seedIds = new Set(MOCK_CAMPAIGNS.map((c) => c.id));
    const userCreated = existing.filter((c) => !seedIds.has(c.id));
    const merged = [...MOCK_CAMPAIGNS, ...userCreated];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
    return merged;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as CampaignSummary[]) : [...MOCK_CAMPAIGNS];
}

function persist(items: CampaignSummary[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const campaignRepository = {
  list: async (): Promise<CampaignSummary[]> => {
    if (USE_MOCK) {
      await delay(300);
      return load();
    }
    const { apiClient } = await import('../client');
    return apiClient.get<CampaignSummary[]>('/campaigns');
  },

  getById: async (id: string): Promise<CampaignSummary> => {
    if (USE_MOCK) {
      await delay(200);
      const campaign = load().find((c) => c.id === id);
      if (!campaign) throw new Error(`Campaign not found: ${id}`);
      return campaign;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<CampaignSummary>(`/campaigns/${id}`);
  },

  save: async (campaign: CampaignSummary): Promise<CampaignSummary> => {
    await delay(100);
    const all = load();
    const idx = all.findIndex((c) => c.id === campaign.id);
    if (idx >= 0) all[idx] = campaign;
    else all.push(campaign);
    persist(all);
    return campaign;
  },
};
