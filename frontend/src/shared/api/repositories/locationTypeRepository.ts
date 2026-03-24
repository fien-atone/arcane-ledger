import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
} from '@/entities/locationType';
import {
  MOCK_LOCATION_TYPES,
  MOCK_CONTAINMENT_RULES,
} from '../mockData/locationTypes';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Storage keys ──────────────────────────────────────────────────────────────

const TYPES_KEY   = 'ttrpg_location_types';
const CONTAIN_KEY = 'ttrpg_location_containment_rules';
const VERSION_KEY = 'ttrpg_location_types_version';
const VERSION     = '10'; // v10: removed connection rules entirely

// ── Generic helpers ───────────────────────────────────────────────────────────

function loadCollection<T extends { id: string }>(key: string, seed: T[]): T[] {
  const version = localStorage.getItem(VERSION_KEY);
  if (version !== VERSION) {
    const raw = localStorage.getItem(key);
    const existing: T[] = raw ? JSON.parse(raw) : [];
    const seedIds = new Set(seed.map((s) => s.id));
    const userCreated = existing.filter((e) => !seedIds.has(e.id));
    const merged = [...seed, ...userCreated];
    localStorage.setItem(key, JSON.stringify(merged));
    return merged;
  }
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [...seed];
}

function persistCollection<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function ensureVersion(): void {
  if (localStorage.getItem(VERSION_KEY) !== VERSION) {
    localStorage.setItem(VERSION_KEY, VERSION);
  }
}

// ── Repository ────────────────────────────────────────────────────────────────

export const locationTypeRepository = {

  // ── Types ──────────────────────────────────────────────────────────────────

  listTypes: async (): Promise<LocationTypeEntry[]> => {
    await delay(150);
    const result = loadCollection(TYPES_KEY, MOCK_LOCATION_TYPES);
    ensureVersion();
    return result;
  },

  saveType: async (entry: LocationTypeEntry): Promise<LocationTypeEntry> => {
    await delay(80);
    const all = loadCollection<LocationTypeEntry>(TYPES_KEY, MOCK_LOCATION_TYPES);
    const idx = all.findIndex((t) => t.id === entry.id);
    if (idx >= 0) all[idx] = entry;
    else all.push(entry);
    persistCollection(TYPES_KEY, all);
    ensureVersion();
    return entry;
  },

  deleteType: async (id: string): Promise<void> => {
    await delay(80);
    const types = loadCollection<LocationTypeEntry>(TYPES_KEY, MOCK_LOCATION_TYPES);
    const type = types.find((t) => t.id === id);
    if (type?.builtin) throw new Error('Cannot delete a built-in location type');
    persistCollection(TYPES_KEY, types.filter((t) => t.id !== id));
    const contain = loadCollection<LocationTypeContainmentRule>(CONTAIN_KEY, MOCK_CONTAINMENT_RULES);
    persistCollection(CONTAIN_KEY, contain.filter((r) => r.parentTypeId !== id && r.childTypeId !== id));
    ensureVersion();
  },

  // ── Containment rules ──────────────────────────────────────────────────────

  listContainmentRules: async (): Promise<LocationTypeContainmentRule[]> => {
    await delay(100);
    const result = loadCollection(CONTAIN_KEY, MOCK_CONTAINMENT_RULES);
    ensureVersion();
    return result;
  },

  saveContainmentRule: async (rule: LocationTypeContainmentRule): Promise<LocationTypeContainmentRule> => {
    await delay(60);
    const all = loadCollection<LocationTypeContainmentRule>(CONTAIN_KEY, MOCK_CONTAINMENT_RULES);
    const idx = all.findIndex((r) => r.id === rule.id);
    if (idx >= 0) all[idx] = rule;
    else all.push(rule);
    persistCollection(CONTAIN_KEY, all);
    ensureVersion();
    return rule;
  },

  deleteContainmentRule: async (id: string): Promise<void> => {
    await delay(60);
    const all = loadCollection<LocationTypeContainmentRule>(CONTAIN_KEY, MOCK_CONTAINMENT_RULES);
    persistCollection(CONTAIN_KEY, all.filter((r) => r.id !== id));
    ensureVersion();
  },
};
