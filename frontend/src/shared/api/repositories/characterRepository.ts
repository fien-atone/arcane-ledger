import type { PlayerCharacter } from '@/entities/character';
import { MOCK_CHARACTERS } from '../mockData/characters';
import { createLocalStore } from '../localStore';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const store = createLocalStore('characters', MOCK_CHARACTERS);

export const characterRepository = {
  list: async (campaignId: string): Promise<PlayerCharacter[]> => {
    if (USE_MOCK) {
      await delay(150);
      return store.list(campaignId);
    }
    const { apiClient } = await import('../client');
    return apiClient.get<PlayerCharacter[]>(`/campaigns/${campaignId}/characters`);
  },

  getById: async (campaignId: string, charId: string): Promise<PlayerCharacter> => {
    if (USE_MOCK) {
      await delay(100);
      const char = store.getById(campaignId, charId);
      if (!char) throw new Error(`Character not found: ${charId}`);
      return char;
    }
    const { apiClient } = await import('../client');
    return apiClient.get<PlayerCharacter>(`/campaigns/${campaignId}/characters/${charId}`);
  },

  save: async (character: PlayerCharacter): Promise<PlayerCharacter> => {
    if (USE_MOCK) {
      return store.upsert(character);
    }
    const { apiClient } = await import('../client');
    return character.updatedAt
      ? apiClient.put<PlayerCharacter>(`/campaigns/${character.campaignId}/characters/${character.id}`, character)
      : apiClient.post<PlayerCharacter>(`/campaigns/${character.campaignId}/characters`, character);
  },
};
