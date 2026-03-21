import type { Session } from '@/entities/session';
import { MOCK_SESSIONS } from '../mockData/sessions';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('sessions', MOCK_SESSIONS);

export const sessionRepository = {
  list: async (campaignId: string): Promise<Session[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId).sort((a, b) => b.number - a.number);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Session[]>(`/campaigns/${campaignId}/sessions`);
  },

  getLast: async (campaignId: string): Promise<Session | null> => {
    if (USE_MOCK) {
      await delay(100);
      const all = store.list(campaignId);
      return all.length > 0 ? all.sort((a, b) => b.number - a.number)[0] : null;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Session>(`/campaigns/${campaignId}/sessions/last`);
  },

  getById: async (campaignId: string, sessionId: string): Promise<Session> => {
    if (USE_MOCK) {
      await delay(100);
      const s = store.getById(campaignId, sessionId);
      if (!s) throw new Error(`Session not found: ${sessionId}`);
      return s;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Session>(`/campaigns/${campaignId}/sessions/${sessionId}`);
  },

  save: async (session: Session): Promise<Session> => {
    if (USE_MOCK) {
      return store.upsert(session);
    }
    const { apiClient } = await import('../client');
    return apiClient.put<Session>(
      `/campaigns/${session.campaignId}/sessions/${session.id}`,
      session
    );
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/sessions/${id}`);
  },
};
