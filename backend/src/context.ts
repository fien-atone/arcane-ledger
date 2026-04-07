import type { PrismaClient, User, Location } from '@prisma/client';
import type DataLoader from 'dataloader';

export interface Context {
  prisma: PrismaClient;
  user: User | null;
  /** Per-request cache for campaign role lookups. */
  _roleCache: Map<string, 'GM' | 'PLAYER' | null>;
  /** Per-request DataLoaders for batching N+1 queries. */
  loaders: {
    /** Batch-load location children by parent location id */
    locationChildren: DataLoader<string, Location[]>;
  };
}
