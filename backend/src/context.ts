import type { PrismaClient, User } from '@prisma/client';

export interface Context {
  prisma: PrismaClient;
  user: User | null;
  /** Per-request cache for campaign role lookups. */
  _roleCache: Map<string, 'GM' | 'PLAYER' | null>;
}
