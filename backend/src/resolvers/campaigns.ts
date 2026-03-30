import type { Context } from '../context.js';
import { toEnum } from './utils.js';

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
      return { ...campaign, myRole: 'GM' };
    },

    updateCampaign: async (_: unknown, args: { id: string; title?: string; description?: string; archivedAt?: string }, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const campaign = await prisma.campaign.update({
        where: { id: args.id },
        data: {
          ...(args.title !== undefined && { title: args.title }),
          ...(args.description !== undefined && { description: args.description }),
          ...(args.archivedAt !== undefined && { archivedAt: args.archivedAt ? new Date(args.archivedAt) : null }),
        },
      });
      const member = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: args.id, userId: user.id } },
      });
      return { ...campaign, myRole: member?.role ?? 'PLAYER' };
    },

    updateCampaignSections: async (
      _: unknown,
      { campaignId, sections }: { campaignId: string; sections: string[] },
      { prisma, user }: Context,
    ) => {
      if (!user) throw new Error('Not authenticated');

      const member = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId, userId: user.id } },
      });
      if (!member || member.role !== 'GM') throw new Error('Only the GM can change sections');

      const VALID = ['SESSIONS', 'NPCS', 'LOCATIONS', 'LOCATION_TYPES', 'GROUPS', 'GROUP_TYPES', 'QUESTS', 'PARTY', 'SOCIAL_GRAPH', 'SPECIES', 'SPECIES_TYPES'];
      const filtered = sections.filter((s) => VALID.includes(s));

      const campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: { enabledSections: filtered },
      });

      return { ...campaign, myRole: member.role };
    },

    saveCharacter: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; gender?: string; age?: number; species?: string; speciesId?: string; class?: string; appearance?: string; background?: string; personality?: string; motivation?: string; bonds?: string; flaws?: string; gmNotes?: string; image?: string },
      { prisma, user }: Context,
    ) => {
      if (!user) throw new Error('Not authenticated');

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

      if (args.id) {
        return prisma.playerCharacter.update({ where: { id: args.id }, data });
      }
      return prisma.playerCharacter.create({ data: { ...data, campaignId: args.campaignId, userId: user.id } });
    },

    addCharacterGroupMembership: async (
      _: unknown,
      { characterId, groupId, relation, subfaction }: { characterId: string; groupId: string; relation?: string; subfaction?: string },
      { prisma }: Context,
    ) => {
      await prisma.characterGroupMembership.upsert({
        where: { characterId_groupId: { characterId, groupId } },
        update: { relation: relation ?? null, subfaction: subfaction ?? null },
        create: { characterId, groupId, relation: relation ?? null, subfaction: subfaction ?? null },
      });
      return prisma.playerCharacter.findUniqueOrThrow({ where: { id: characterId } });
    },

    removeCharacterGroupMembership: async (
      _: unknown,
      { characterId, groupId }: { characterId: string; groupId: string },
      { prisma }: Context,
    ) => {
      await prisma.characterGroupMembership.delete({
        where: { characterId_groupId: { characterId, groupId } },
      });
      return prisma.playerCharacter.findUniqueOrThrow({ where: { id: characterId } });
    },
  },

  PlayerCharacter: {
    groupMemberships: (character: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.characterGroupMembership.findMany({ where: { characterId: character.id }, include: { group: true } }),
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
