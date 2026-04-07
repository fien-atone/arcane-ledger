/**
 * DataLoader factories — per-request batching for N+1 query prevention.
 *
 * A new instance is created for each GraphQL request via createApp/middleware.
 * DataLoader collects all calls within a single tick of the event loop and
 * issues one batched query instead of many individual ones.
 */

import DataLoader from 'dataloader';
import type { PrismaClient, Location } from '@prisma/client';

export function createLoaders(prisma: PrismaClient) {
  return {
    /**
     * Batch-load child locations by parent id.
     * One query like `WHERE parentLocationId IN (?, ?, ?)` instead of N queries.
     */
    locationChildren: new DataLoader<string, Location[]>(async (parentIds) => {
      const all = await prisma.location.findMany({
        where: { parentLocationId: { in: [...parentIds] } },
        orderBy: { name: 'asc' },
      });
      // Group by parentLocationId, preserving order matching parentIds
      const byParent = new Map<string, Location[]>();
      for (const loc of all) {
        if (!loc.parentLocationId) continue;
        const list = byParent.get(loc.parentLocationId) ?? [];
        list.push(loc);
        byParent.set(loc.parentLocationId, list);
      }
      return parentIds.map((id) => byParent.get(id) ?? []);
    }),
  };
}
