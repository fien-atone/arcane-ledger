import type { Context } from '../context.js';
import { toEnum, requireGM } from './utils.js';
import { GraphQLError } from 'graphql';
import { publishCampaignEvent } from '../publish.js';

export const campaignResolvers = {
  Query: {
    campaigns: async (_: unknown, __: unknown, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const members = await prisma.campaignMember.findMany({
        where: { userId: user.id },
        include: { campaign: true },
      });
      return members.map((m) => ({ ...m.campaign, myRole: m.role }));
    },

    campaign: async (_: unknown, { id }: { id: string }, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const member = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: id, userId: user.id } },
        include: { campaign: true },
      });
      if (!member) throw new Error('Not found');
      return { ...member.campaign, myRole: member.role };
    },

    party: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.playerCharacter.findMany({ where: { campaignId } }),
  },

  Mutation: {
    createCampaign: async (_: unknown, { title, description }: { title: string; description?: string }, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const campaign = await prisma.campaign.create({
        data: {
          title,
          description,
          members: { create: { userId: user.id, role: 'GM' } },
        },
      });
      publishCampaignEvent(campaign.id, 'CAMPAIGN', campaign.id, 'CREATED');
      return { ...campaign, myRole: 'GM' };
    },

    updateCampaign: async (_: unknown, args: { id: string; title?: string; description?: string; archivedAt?: string }, ctx: Context) => {
      const { prisma, user } = ctx;
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await requireGM(ctx, args.id);
      const campaign = await prisma.campaign.update({
        where: { id: args.id },
        data: {
          ...(args.title !== undefined && { title: args.title }),
          ...(args.description !== undefined && { description: args.description }),
          ...(args.archivedAt !== undefined && { archivedAt: args.archivedAt ? new Date(args.archivedAt) : null }),
        },
      });
      publishCampaignEvent(args.id, 'CAMPAIGN', args.id, 'UPDATED');
      return { ...campaign, myRole: 'GM' };
    },

    updateCampaignSections: async (
      _: unknown,
      { campaignId, sections }: { campaignId: string; sections: string[] },
      ctx: Context,
    ) => {
      const { prisma, user } = ctx;
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await requireGM(ctx, campaignId);

      const VALID = ['SESSIONS', 'NPCS', 'LOCATIONS', 'LOCATION_TYPES', 'GROUPS', 'GROUP_TYPES', 'QUESTS', 'PARTY', 'SOCIAL_GRAPH', 'SPECIES', 'SPECIES_TYPES'];
      const filtered = sections.filter((s) => VALID.includes(s));

      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: { enabledSections: filtered },
      });

      publishCampaignEvent(campaignId, 'CAMPAIGN', campaignId, 'UPDATED');
      return { ...campaign, myRole: 'GM' };
    },

    saveCharacter: async (
      _: unknown,
      args: { campaignId: string; id?: string; userId?: string | null; name: string; gender?: string; age?: number; species?: string; speciesId?: string; class?: string; appearance?: string; background?: string; personality?: string; motivation?: string; bonds?: string; flaws?: string; gmNotes?: string; image?: string },
      ctx: Context,
    ) => {
      const { prisma, user } = ctx;
      if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
      await requireGM(ctx, args.campaignId);

      const data: Record<string, unknown> = {
        name: args.name,
        gender: args.gender ? toEnum(args.gender, 'MALE') : null,
        age: args.age ?? null,
        species: args.species ?? null,
        speciesId: args.speciesId ?? null,
        class: args.class ?? null,
        appearance: args.appearance ?? null,
        background: args.background ?? null,
        personality: args.personality ?? null,
        motivation: args.motivation ?? null,
        bonds: args.bonds ?? null,
        flaws: args.flaws ?? null,
        gmNotes: args.gmNotes ?? '',
      };
      if (args.image !== undefined) data.image = args.image ?? null;

      // Allow GM to set userId on update
      if (args.id) {
        if (args.userId !== undefined) data.userId = args.userId || null;
        const result = await prisma.playerCharacter.update({ where: { id: args.id }, data });
        publishCampaignEvent(args.campaignId, 'CHARACTER', result.id, 'UPDATED');
        return result;
      }

      // On create: GM can assign or leave unassigned (requireGM already verified)
      const assignedUserId = args.userId || null;

      const result = await prisma.playerCharacter.create({ data: { ...data, campaignId: args.campaignId, userId: assignedUserId } as Parameters<typeof prisma.playerCharacter.create>[0]['data'] });
      publishCampaignEvent(args.campaignId, 'CHARACTER', result.id, 'CREATED');
      return result;
    },

    deleteCharacter: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      await requireGM(ctx, campaignId);
      const { prisma } = ctx;
      await prisma.playerCharacter.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'CHARACTER', id, 'DELETED');
      return true;
    },

    addCharacterGroupMembership: async (
      _: unknown,
      { characterId, groupId, relation, subfaction }: { characterId: string; groupId: string; relation?: string; subfaction?: string },
      ctx: Context,
    ) => {
      const { prisma } = ctx;
      const charForAuth = await prisma.playerCharacter.findUniqueOrThrow({ where: { id: characterId } });
      await requireGM(ctx, charForAuth.campaignId);
      await prisma.characterGroupMembership.upsert({
        where: { characterId_groupId: { characterId, groupId } },
        update: { relation: relation ?? null, subfaction: subfaction ?? null },
        create: { characterId, groupId, relation: relation ?? null, subfaction: subfaction ?? null },
      });
      const character = await prisma.playerCharacter.findUniqueOrThrow({ where: { id: characterId } });
      publishCampaignEvent(character.campaignId, 'CHARACTER_MEMBERSHIP', characterId, 'UPDATED', [groupId]);
      return character;
    },

    removeCharacterGroupMembership: async (
      _: unknown,
      { characterId, groupId }: { characterId: string; groupId: string },
      ctx: Context,
    ) => {
      const { prisma } = ctx;
      const charForAuth = await prisma.playerCharacter.findUniqueOrThrow({ where: { id: characterId } });
      await requireGM(ctx, charForAuth.campaignId);
      await prisma.characterGroupMembership.delete({
        where: { characterId_groupId: { characterId, groupId } },
      });
      const character = await prisma.playerCharacter.findUniqueOrThrow({ where: { id: characterId } });
      publishCampaignEvent(character.campaignId, 'CHARACTER_MEMBERSHIP', characterId, 'DELETED', [groupId]);
      return character;
    },
  },

  PlayerCharacter: {
    groupMemberships: (character: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.characterGroupMembership.findMany({ where: { characterId: character.id }, include: { group: true } }),
    player: (character: { userId: string | null }, _: unknown, { prisma }: Context) =>
      character.userId ? prisma.user.findUnique({ where: { id: character.userId } }) : null,
  },

  Campaign: {
    enabledSections: (campaign: { enabledSections?: string[] }) =>
      campaign.enabledSections ?? [],
    sessionCount: (campaign: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.session.count({ where: { campaignId: campaign.id } }),
    memberCount: (campaign: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.campaignMember.count({ where: { campaignId: campaign.id } }),
    lastSession: (campaign: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.session.findFirst({ where: { campaignId: campaign.id }, orderBy: { number: 'desc' } }),
  },
};
