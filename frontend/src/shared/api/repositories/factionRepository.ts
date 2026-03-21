import type { Faction } from '@/entities/faction';
import { MOCK_FACTIONS } from '../mockData/factions';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('factions', MOCK_FACTIONS);

export const factionRepository = {
  list: async (campaignId: string): Promise<Faction[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Faction[]>(`/campaigns/${campaignId}/factions`);
  },

  getById: async (campaignId: string, factionId: string): Promise<Faction> => {
    if (USE_MOCK) {
      await delay(100);
      const faction = store.getById(campaignId, factionId);
      if (!faction) throw new Error('Faction not found');
      return faction;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Faction>(`/campaigns/${campaignId}/factions/${factionId}`);
  },

  save: async (faction: Faction): Promise<Faction> => {
    if (USE_MOCK) {
      return store.upsert(faction);
    }
    const { apiClient } = await import('../client');
    return apiClient.put<Faction>(
      `/campaigns/${faction.campaignId}/factions/${faction.id}`,
      faction
    );
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/factions/${id}`);
  },
};
