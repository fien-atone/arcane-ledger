import type { Group } from '@/entities/group';
import { MOCK_GROUPS } from '../mockData/groups';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('groups', MOCK_GROUPS);

export const groupRepository = {
  list: async (campaignId: string): Promise<Group[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Group[]>(`/campaigns/${campaignId}/groups`);
  },

  getById: async (campaignId: string, groupId: string): Promise<Group> => {
    if (USE_MOCK) {
      await delay(100);
      const group = store.getById(campaignId, groupId);
      if (!group) throw new Error('Group not found');
      return group;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Group>(`/campaigns/${campaignId}/groups/${groupId}`);
  },

  save: async (group: Group): Promise<Group> => {
    if (USE_MOCK) {
      return store.upsert(group);
    }
    const { apiClient } = await import('../client');
    return apiClient.put<Group>(
      `/campaigns/${group.campaignId}/groups/${group.id}`,
      group
    );
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/groups/${id}`);
  },
};
