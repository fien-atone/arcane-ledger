import type { User } from '@prisma/client';
import { GraphQLError } from 'graphql';
import type { Context } from '../context.js';

/** Normalise an enum value to UPPERCASE (frontend may send lowercase). */
export const toEnum = <T extends string>(val: string | undefined | null, fallback: T): T =>
  (val ? val.toUpperCase() : fallback) as T;

/** Throw if the current user is not an authenticated ADMIN. */
export function requireAdmin(user: User | null): asserts user is User {
  if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
}

/**
 * Get the user's role in a campaign, with per-request caching.
 * Returns 'GM', 'PLAYER', or null if not a member.
 */
export async function getCampaignRole(
  ctx: Context,
  campaignId: string,
): Promise<'GM' | 'PLAYER' | null> {
  if (!ctx.user) return null;
  const cacheKey = `${ctx.user.id}:${campaignId}`;
  if (ctx._roleCache.has(cacheKey)) return ctx._roleCache.get(cacheKey)!;

  const member = await ctx.prisma.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId: ctx.user.id } },
  });
  const role = (member?.role as 'GM' | 'PLAYER') ?? null;
  ctx._roleCache.set(cacheKey, role);
  return role;
}

/** Throw FORBIDDEN if the current user is not a GM for the given campaign. */
export async function requireGM(ctx: Context, campaignId: string): Promise<void> {
  if (!ctx.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const role = await getCampaignRole(ctx, campaignId);
  if (role !== 'GM') {
    throw new GraphQLError('Only the GM can modify campaign data', { extensions: { code: 'FORBIDDEN' } });
  }
}

/** Throw UNAUTHENTICATED if the current user is not a member of the given campaign. */
export async function requireCampaignMember(ctx: Context, campaignId: string): Promise<void> {
  if (!ctx.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  const role = await getCampaignRole(ctx, campaignId);
  if (!role) {
    throw new GraphQLError('You are not a member of this campaign', { extensions: { code: 'FORBIDDEN' } });
  }
}