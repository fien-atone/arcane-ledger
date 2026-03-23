import type { GroupTypeEntry } from '@/entities/groupType';
import { GROUP_TYPES_SEED } from '../mockData/groupTypes';

const STORAGE_KEY = 'ttrpg_group_types';
const STORAGE_VERSION = '1';
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function load(): GroupTypeEntry[] {
  const version = localStorage.getItem(`${STORAGE_KEY}_version`);
  if (version !== STORAGE_VERSION) {
    // Version bump: refresh seed records, preserve user-created ones
    const existing: GroupTypeEntry[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const seedIds = new Set(GROUP_TYPES_SEED.map((s) => s.id));
    const userCreated = existing.filter((s) => !seedIds.has(s.id));
    const merged = [...GROUP_TYPES_SEED, ...userCreated];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);
    return merged;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as GroupTypeEntry[]) : [...GROUP_TYPES_SEED];
}

function persist(items: GroupTypeEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const groupTypeRepository = {
  list: async (): Promise<GroupTypeEntry[]> => {
    await delay(80);
    return load();
  },

  getById: async (id: string): Promise<GroupTypeEntry | undefined> => {
    await delay(50);
    return load().find((s) => s.id === id);
  },

  save: async (entry: GroupTypeEntry): Promise<GroupTypeEntry> => {
    await delay(80);
    const all = load();
    const idx = all.findIndex((s) => s.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    persist(all);
    return entry;
  },

  delete: async (id: string): Promise<void> => {
    await delay(60);
    persist(load().filter((s) => s.id !== id));
  },
};
