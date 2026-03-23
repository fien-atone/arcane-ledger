import type { Relation } from '@/entities/relation';
import { MOCK_RELATIONS } from '../mockData/relations';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('relations', MOCK_RELATIONS);

export const relationRepository = {
  listForCampaign: async (campaignId: string): Promise<Relation[]> => {
    if (USE_MOCK) {
      await delay(100);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Relation[]>(`/campaigns/${campaignId}/relations`);
  },

  listForEntity: async (campaignId: string, entityId: string): Promise<Relation[]> => {
    if (USE_MOCK) {
      await delay(80);
      return store
        .list(campaignId)
        .filter(
          (r) => r.fromEntity.id === entityId || r.toEntity.id === entityId,
        );
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Relation[]>(
      `/campaigns/${campaignId}/relations?entityId=${entityId}`,
    );
  },

  save: async (relation: Relation): Promise<Relation> => {
    if (USE_MOCK) {
      return store.upsert(relation);
    }
    const { apiClient } = await import('../client');
    return apiClient.post<Relation>(
      `/campaigns/${relation.campaignId}/relations`,
      relation,
    );
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/relations/${id}`);
  },
};
