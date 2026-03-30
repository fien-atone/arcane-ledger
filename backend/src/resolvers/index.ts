import { adminResolvers } from './admin.js';
import { authResolvers } from './auth.js';
import { campaignResolvers } from './campaigns.js';
import { sessionResolvers } from './sessions.js';
import { npcResolvers } from './npcs.js';
import { questResolvers } from './quests.js';
import { groupResolvers } from './groups.js';
import { locationResolvers } from './locations.js';
import { relationResolvers } from './relations.js';
import { referenceDataResolvers } from './referenceData.js';
import { subscriptionResolvers } from './subscriptions.js';

type ResolverMap = Record<string, Record<string, unknown>>;

/** Deep-merge resolver maps: Query, Mutation, and type-level field resolvers. */
function mergeResolvers(...maps: ResolverMap[]): ResolverMap {
  const result: ResolverMap = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      result[key] = { ...result[key], ...value };
    }
  }
  return result;
}

export const resolvers = mergeResolvers(
  adminResolvers,
  authResolvers,
  campaignResolvers,
  sessionResolvers,
  npcResolvers,
  questResolvers,
  groupResolvers,
  locationResolvers,
  relationResolvers,
  referenceDataResolvers,
  subscriptionResolvers,
);
