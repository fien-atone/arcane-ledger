/**
 * Generic localStorage-backed store for prototype CRUD.
 *
 * Version strategy: when STORE_VERSION changes, existing seed-data records are
 * replaced with the new seed values, but user-created records (IDs not present
 * in the seed) are preserved.
 */

const STORE_VERSION = '8'; // bump when seed data changes significantly

export interface Storable {
  id: string;
  campaignId: string;
}

export function createLocalStore<T extends Storable>(key: string, seed: readonly T[]) {
  const dataKey = `ttrpg_${key}`;
  const versionKey = `ttrpg_${key}_version`;

  function load(): T[] {
    const storedVersion = localStorage.getItem(versionKey);

    if (storedVersion !== STORE_VERSION) {
      // Version changed — refresh seed records, keep user-created ones
      const existing: T[] = JSON.parse(localStorage.getItem(dataKey) ?? '[]');
      const seedIds = new Set(seed.map((s) => s.id));
      const userCreated = existing.filter((item) => !seedIds.has(item.id));
      const merged = [...seed, ...userCreated];
      localStorage.setItem(dataKey, JSON.stringify(merged));
      localStorage.setItem(versionKey, STORE_VERSION);
      return merged;
    }

    const raw = localStorage.getItem(dataKey);
    return raw ? (JSON.parse(raw) as T[]) : [...seed];
  }

  function persist(items: T[]): void {
    localStorage.setItem(dataKey, JSON.stringify(items));
  }

  return {
    list(campaignId: string): T[] {
      return load().filter((item) => item.campaignId === campaignId);
    },

    getById(campaignId: string, id: string): T | undefined {
      return load().find((item) => item.id === id && item.campaignId === campaignId);
    },

    upsert(item: T): T {
      const all = load();
      const idx = all.findIndex((i) => i.id === item.id);
      if (idx >= 0) all[idx] = item;
      else all.push(item);
      persist(all);
      return item;
    },

    remove(id: string): void {
      persist(load().filter((i) => i.id !== id));
    },

    /** Wipe localStorage for this key and re-seed from mock data. */
    reset(): void {
      localStorage.setItem(dataKey, JSON.stringify(seed));
      localStorage.setItem(versionKey, STORE_VERSION);
    },
  };
}
