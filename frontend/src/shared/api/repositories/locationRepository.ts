import type { Location } from '@/entities/location';
import { MOCK_LOCATIONS } from '../mockData/locations';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('locations', MOCK_LOCATIONS);

export const locationRepository = {
  list: async (campaignId: string): Promise<Location[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Location[]>(`/campaigns/${campaignId}/locations`);
  },

  getById: async (campaignId: string, locationId: string): Promise<Location> => {
    if (USE_MOCK) {
      await delay(100);
      const loc = store.getById(campaignId, locationId);
      if (!loc) throw new Error('Location not found');
      return loc;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<Location>(`/campaigns/${campaignId}/locations/${locationId}`);
  },

  save: async (location: Location): Promise<Location> => {
    if (USE_MOCK) {
      return store.upsert(location);
    }
    const { apiClient } = await import('../client');
    return apiClient.put<Location>(
      `/campaigns/${location.campaignId}/locations/${location.id}`,
      location
    );
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      store.remove(id);
      return;
    }
    const { apiClient } = await import('../client');
    return apiClient.delete(`/locations/${id}`);
  },
};
