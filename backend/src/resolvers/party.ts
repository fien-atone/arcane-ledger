import type { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { requireGM as requireGMShared } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { pubsub } from '../pubsub.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function requireAuth(user: Context['user']): asserts user is NonNullable<Context['user']> {
  if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
}

function publishUserEvent(userId: string, type: string, entityId: string) {
  try {
    pubsub.publish(`USER_EVENT:${userId}`, { userEvent: { type, entityId } });
  } catch {
    // Silently ignore
  }
}

// ── Resolvers ────────────────────────────────────────────────────────────────

export const partyResolvers = {
  Query: {
    myInvitations: async (_: unknown, __: unknown, { prisma, user }: Context) => {
      requireAuth(user);
      return prisma.campaignInvitation.findMany({
        where: { userId: user.id, status: 'PENDING' },
        include: { campaign: true, user: true, invitedBy: true },
        orderBy: { createdAt: 'desc' },
      });
    },

    campaignInvitations: async (_: unknown, { campaignId }: { campaignId: string }, { prisma, user }: Context) => {
      requireAuth(user);
      return prisma.campaignInvitation.findMany({
        where: { campaignId },
        include: { campaign: true, user: true, invitedBy: true },
        orderBy: { createdAt: 'desc' },
      });
    },

    partySlots: async (_: unknown, { campaignId }: { campaignId: string }, { prisma, user }: Context) => {
      requireAuth(user);

      // Fetch all three data sources in parallel
      const [members, characters, pendingInvitations] = await Promise.all([
        prisma.campaignMember.findMany({
          where: { campaignId, role: 'PLAYER' },
          include: { user: true },
        }),
        prisma.playerCharacter.findMany({
          where: { campaignId },
        }),
        prisma.campaignInvitation.findMany({
          where: { campaignId, status: 'PENDING' },
          include: { campaign: true, user: true, invitedBy: true },
        }),
      ]);

      const slots: Array<{
        member: (typeof members)[number] | null;
        character: (typeof characters)[number] | null;
        invitation: (typeof pendingInvitations)[number] | null;
      }> = [];

      // Track which characters are already assigned to a member slot
      const usedCharacterIds = new Set<string>();
      // Track which user IDs already have a member slot (to avoid invitation duplication)
      const memberUserIds = new Set(members.map((m) => m.userId));

      // 1. For each PLAYER member: create slot with member + their character (if any)
      for (const member of members) {
        const character = characters.find((c) => c.userId === member.userId) ?? null;
        if (character) usedCharacterIds.add(character.id);
        slots.push({ member, character, invitation: null });
      }

      // 2. For each unassigned character (userId is null and not already in a slot)
      for (const character of characters) {
        if (!character.userId && !usedCharacterIds.has(character.id)) {
          slots.push({ member: null, character, invitation: null });
        }
      }

      // 3. For each PENDING invitation where user is not already a member
      for (const invitation of pendingInvitations) {
        if (!memberUserIds.has(invitation.userId)) {
          slots.push({ member: null, character: null, invitation });
        }
      }

      return slots;
    },

    searchUsers: async (
      _: unknown,
      { campaignId, query }: { campaignId: string; query: string },
      ctx: Context,
    ) => {
      const { prisma, user } = ctx;
      requireAuth(user);
      await requireGMShared(ctx, campaignId);

      if (query.length < 2) return [];

      // Get existing members and pending invitations to exclude
      const [existingMembers, pendingInvitations] = await Promise.all([
        prisma.campaignMember.findMany({ where: { campaignId }, select: { userId: true } }),
        prisma.campaignInvitation.findMany({ where: { campaignId, status: 'PENDING' }, select: { userId: true } }),
      ]);

      const excludeIds = new Set([
        ...existingMembers.map((m) => m.userId),
        ...pendingInvitations.map((i) => i.userId),
      ]);

      return prisma.user.findMany({
        where: {
          AND: [
            { id: { notIn: [...excludeIds] } },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        take: 10,
      });
    },
  },

  Mutation: {
    invitePlayer: async (
      _: unknown,
      { campaignId, userId }: { campaignId: string; userId: string },
      ctx: Context,
    ) => {
      const { prisma, user } = ctx;
      requireAuth(user);
      await requireGMShared(ctx, campaignId);

      // Check user is not already a member
      const existingMember = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId, userId } },
      });
      if (existingMember) {
        throw new GraphQLError('User is already a member of this campaign', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Upsert: allow re-invite if previously DECLINED
      const invitation = await prisma.campaignInvitation.upsert({
        where: { campaignId_userId: { campaignId, userId } },
        update: { status: 'PENDING', invitedById: user.id, respondedAt: null },
        create: { campaignId, userId, invitedById: user.id, status: 'PENDING' },
        include: { campaign: true, user: true, invitedBy: true },
      });

      publishCampaignEvent(campaignId, 'INVITATION', invitation.id, 'CREATED');
      publishUserEvent(userId, 'INVITATION_RECEIVED', invitation.id);

      return invitation;
    },

    cancelInvitation: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma, user } = ctx;
      requireAuth(user);

      const invitation = await prisma.campaignInvitation.findUnique({ where: { id } });
      if (!invitation) throw new GraphQLError('Invitation not found', { extensions: { code: 'NOT_FOUND' } });

      await requireGMShared(ctx, invitation.campaignId);

      await prisma.campaignInvitation.delete({ where: { id } });

      publishCampaignEvent(invitation.campaignId, 'INVITATION', id, 'DELETED');
      publishUserEvent(invitation.userId, 'INVITATION_RECEIVED', id);

      return true;
    },

    respondToInvitation: async (
      _: unknown,
      { id, accept }: { id: string; accept: boolean },
      { prisma, user }: Context,
    ) => {
      requireAuth(user);

      const invitation = await prisma.campaignInvitation.findUnique({
        where: { id },
      });
      if (!invitation) throw new GraphQLError('Invitation not found', { extensions: { code: 'NOT_FOUND' } });
      if (invitation.userId !== user.id) {
        throw new GraphQLError('You can only respond to your own invitations', { extensions: { code: 'FORBIDDEN' } });
      }
      if (invitation.status !== 'PENDING') {
        throw new GraphQLError('Invitation has already been responded to', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (accept) {
        // Accept: update invitation + create CampaignMember in a transaction
        const [updated] = await prisma.$transaction([
          prisma.campaignInvitation.update({
            where: { id },
            data: { status: 'ACCEPTED', respondedAt: new Date() },
            include: { campaign: true, user: true, invitedBy: true },
          }),
          prisma.campaignMember.create({
            data: { campaignId: invitation.campaignId, userId: user.id, role: 'PLAYER' },
          }),
        ]);

        publishCampaignEvent(invitation.campaignId, 'INVITATION', id, 'UPDATED');
        publishCampaignEvent(invitation.campaignId, 'MEMBER', user.id, 'CREATED');
        // Notify the player's campaign list
        try {
          pubsub.publish('CAMPAIGNS_CHANGED', {
            campaignsChanged: {
              entityType: 'CAMPAIGN',
              entityId: invitation.campaignId,
              action: 'UPDATED',
              campaignId: invitation.campaignId,
              relatedIds: [],
            },
          });
        } catch {
          // Silently ignore
        }

        return updated;
      } else {
        // Decline
        const updated = await prisma.campaignInvitation.update({
          where: { id },
          data: { status: 'DECLINED', respondedAt: new Date() },
          include: { campaign: true, user: true, invitedBy: true },
        });

        publishCampaignEvent(invitation.campaignId, 'INVITATION', id, 'UPDATED');

        return updated;
      }
    },

    assignCharacterToPlayer: async (
      _: unknown,
      { characterId, userId }: { characterId: string; userId?: string | null },
      ctx: Context,
    ) => {
      const { prisma, user } = ctx;
      requireAuth(user);

      const character = await prisma.playerCharacter.findUnique({ where: { id: characterId } });
      if (!character) throw new GraphQLError('Character not found', { extensions: { code: 'NOT_FOUND' } });

      await requireGMShared(ctx, character.campaignId);

      // If userId provided, verify user is a member of the campaign
      if (userId) {
        const member = await prisma.campaignMember.findUnique({
          where: { campaignId_userId: { campaignId: character.campaignId, userId } },
        });
        if (!member) {
          throw new GraphQLError('User is not a member of this campaign', { extensions: { code: 'BAD_USER_INPUT' } });
        }
      }

      const updated = await prisma.playerCharacter.update({
        where: { id: characterId },
        data: { userId: userId ?? null },
      });

      publishCampaignEvent(character.campaignId, 'CHARACTER', characterId, 'UPDATED');

      return updated;
    },

    removeCampaignMember: async (
      _: unknown,
      { campaignId, userId }: { campaignId: string; userId: string },
      ctx: Context,
    ) => {
      const { prisma, user } = ctx;
      requireAuth(user);
      await requireGMShared(ctx, campaignId);

      // Cannot remove self (GM)
      if (userId === user.id) {
        throw new GraphQLError('Cannot remove yourself from the campaign', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Delete the member
      await prisma.campaignMember.delete({
        where: { campaignId_userId: { campaignId, userId } },
      });

      // Unassign any characters belonging to this user in this campaign
      await prisma.playerCharacter.updateMany({
        where: { campaignId, userId },
        data: { userId: null },
      });

      publishCampaignEvent(campaignId, 'MEMBER', userId, 'DELETED');
      // Notify the kicked player so their campaign list updates
      publishUserEvent(userId, 'MEMBER_REMOVED', campaignId);
      try {
        pubsub.publish('CAMPAIGNS_CHANGED', {
          campaignsChanged: { entityType: 'CAMPAIGN', entityId: campaignId, action: 'UPDATED', campaignId, relatedIds: [] },
        });
      } catch { /* ignore */ }

      return true;
    },
  },

  // ── Field resolvers ────────────────────────────────────────────────────────

  // Note: CampaignInvitation field resolvers removed.
  // The campaign/user/invitedBy fields are populated via Prisma `include` in
  // myInvitations / campaignInvitations / partySlots queries, so GraphQL
  // returns them directly from the parent object — avoiding N+1 queries.

  PartySlot: {
    member: (slot: { member: unknown }) => slot.member,
    character: (slot: { character: unknown }) => slot.character,
    invitation: (slot: { invitation: unknown }) => slot.invitation,
  },
};
