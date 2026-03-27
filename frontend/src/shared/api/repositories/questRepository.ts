import type { Quest } from '@/entities/quest';
import { MOCK_QUESTS } from '../mockData/quests';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('quests', MOCK_QUESTS);

export const questRepository = {
  list: async (campaignId: string): Promise<Quest[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Quest[]>(`/campaigns/${campaignId}/quests`);
  },

  getActive: async (campaignId: string): Promise<Quest[]> => {
    if (USE_MOCK) {
      await delay(100);
      return store
        .list(campaignId)
        .filter((q) => q.status === 'active' || q.status === 'undiscovered');
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Quest[]>(`/campaigns/${campaignId}/quests?status=active`);
  },

  getById: async (campaignId: string, questId: string): Promise<Quest> => {
    if (USE_MOCK) {
      await delay(100);
      const quest = store.getById(campaignId, questId);
      if (!quest) throw new Error('Quest not found');
      return quest;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Quest>(`/campaigns/${campaignId}/quests/${questId}`);
  },

  save: async (quest: Quest): Promise<Quest> => {
    if (USE_MOCK) {
      return store.upsert(quest);
    }
    const { apiClient } = await import('../client');
    return apiClient.put<Quest>(
      `/campaigns/${quest.campaignId}/quests/${quest.id}`,
      quest
    );
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/quests/${id}`);
  },
};
