import type { NPC } from '@/entities/npc';
import { MOCK_NPCS } from '../mockData/npcs';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('npcs', MOCK_NPCS);

export const npcRepository = {
  list: async (campaignId: string): Promise<NPC[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<NPC[]>(`/campaigns/${campaignId}/npcs`);
  },

  getById: async (campaignId: string, npcId: string): Promise<NPC> => {
    if (USE_MOCK) {
      await delay(100);
      const npc = store.getById(campaignId, npcId);
      if (!npc) throw new Error(`NPC not found: ${npcId}`);
      return npc;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<NPC>(`/campaigns/${campaignId}/npcs/${npcId}`);
  },

  save: async (npc: NPC): Promise<NPC> => {
    if (USE_MOCK) {
      return store.upsert(npc);
    }
    const { apiClient } = await import('../client');
    return npc.createdAt === npc.updatedAt
      ? apiClient.post<NPC>(`/campaigns/${npc.campaignId}/npcs`, npc)
      : apiClient.put<NPC>(`/campaigns/${npc.campaignId}/npcs/${npc.id}`, npc);
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/npcs/${id}`);
  },
};
