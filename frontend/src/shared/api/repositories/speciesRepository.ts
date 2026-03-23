import type { Species } from '@/entities/species';
import { MOCK_SPECIES } from '../mockData/species';

const STORAGE_KEY = 'ttrpg_species';
const STORAGE_VERSION = '2';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function load(): Species[] {
  const version = localStorage.getItem(`${STORAGE_KEY}_version`);
  if (version !== STORAGE_VERSION) {
    // Version bump: refresh seed records, preserve user-created ones
    const existing: Species[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const seedIds = new Set(MOCK_SPECIES.map((s) => s.id));
    const userCreated = existing.filter((s) => !seedIds.has(s.id));
    const merged = [...MOCK_SPECIES, ...userCreated];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
    return merged;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Species[]) : [...MOCK_SPECIES];
}

function persist(items: Species[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const speciesRepository = {
  list: async (): Promise<Species[]> => {
    await delay(80);
    return load();
  },

  getById: async (id: string): Promise<Species | undefined> => {
    await delay(50);
    return load().find((s) => s.id === id);
  },

  save: async (species: Species): Promise<Species> => {
    await delay(80);
    const all = load();
    const idx = all.findIndex((s) => s.id === species.id);
    if (idx >= 0) all[idx] = species;
    else all.push(species);
    persist(all);
    return species;
  },

  delete: async (id: string): Promise<void> => {
    await delay(60);
    persist(load().filter((s) => s.id !== id));
  },
};
