import type { Context } from '../context.js';
import { toEnum, getCampaignRole } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { redactEntity, NPC_FIELDS } from './redact.js';

export const npcResolvers = {
  Query: {
    npcs: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const where = role === 'PLAYER'
        ? { campaignId, playerVisible: true as const }
        : { campaignId };
      const npcs = await ctx.prisma.nPC.findMany({ where, orderBy: { name: 'asc' } });
      if (role === 'PLAYER') {
        return npcs.map((npc) => redactEntity(npc, npc.playerVisibleFields, NPC_FIELDS));
      }
      return npcs;
    },

    npc: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const entity = await ctx.prisma.nPC.findFirst({ where: { id, campaignId } });
      if (!entity) return null;
      const role = await getCampaignRole(ctx, campaignId);
      if (role === 'PLAYER') {
        if (!entity.playerVisible) return null;
        return redactEntity(entity, entity.playerVisibleFields, NPC_FIELDS);
      }
      return entity;
    },
  },

  Mutation: {
    saveNPC: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; aliases?: string[]; status?: string; gender?: string; age?: number; species?: string; speciesId?: string; appearance?: string; personality?: string; description?: string; motivation?: string; flaws?: string; gmNotes?: string; image?: string } },
      { prisma }: Context,
    ) => {
      const data: Record<string, unknown> = {
        name: input.name,
        aliases: input.aliases ?? [],
        status: toEnum(input.status, 'ALIVE'),
        gender: input.gender ? toEnum(input.gender, 'MALE') : null,
        age: input.age ?? null,
        species: input.species ?? null,
        speciesId: input.speciesId ?? null,
        appearance: input.appearance ?? null,
        personality: input.personality ?? null,
        description: input.description ?? '',
        motivation: input.motivation ?? null,
        flaws: input.flaws ?? null,
        gmNotes: input.gmNotes ?? null,
      };
      if (input.image !== undefined) data.image = input.image ?? null;

      if (id) {
        const result = await prisma.nPC.update({ where: { id }, data });
        publishCampaignEvent(campaignId, 'NPC', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.nPC.create({ data: { ...data, campaignId } });
      publishCampaignEvent(campaignId, 'NPC', result.id, 'CREATED');
      return result;
    },

    deleteNPC: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.nPC.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'NPC', id, 'DELETED');
      return true;
    },

    addNPCLocationPresence: async (
      _: unknown,
      { npcId, locationId, note }: { npcId: string; locationId: string; note?: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCLocationPresence.upsert({
        where: { npcId_locationId: { npcId, locationId } },
        update: { note: note ?? null },
        create: { npcId, locationId, note: note ?? null },
      });
      const npc = await prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
      publishCampaignEvent(npc.campaignId, 'NPC_PRESENCE', npcId, 'UPDATED', [locationId]);
      return npc;
    },

    removeNPCLocationPresence: async (
      _: unknown,
      { npcId, locationId }: { npcId: string; locationId: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCLocationPresence.delete({
        where: { npcId_locationId: { npcId, locationId } },
      });
      const npc = await prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
      publishCampaignEvent(npc.campaignId, 'NPC_PRESENCE', npcId, 'DELETED', [locationId]);
      return npc;
    },

    addNPCGroupMembership: async (
      _: unknown,
      { npcId, groupId, relation, subfaction }: { npcId: string; groupId: string; relation?: string; subfaction?: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCGroupMembership.upsert({
        where: { npcId_groupId: { npcId, groupId } },
        update: { relation: relation ?? null, subfaction: subfaction ?? null },
        create: { npcId, groupId, relation: relation ?? null, subfaction: subfaction ?? null },
      });
      const npc = await prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
      publishCampaignEvent(npc.campaignId, 'NPC_MEMBERSHIP', npcId, 'UPDATED', [groupId]);
      return npc;
    },

    removeNPCGroupMembership: async (
      _: unknown,
      { npcId, groupId }: { npcId: string; groupId: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCGroupMembership.delete({
        where: { npcId_groupId: { npcId, groupId } },
      });
      const npc = await prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
      publishCampaignEvent(npc.campaignId, 'NPC_MEMBERSHIP', npcId, 'DELETED', [groupId]);
      return npc;
    },

    setNPCVisibility: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id: string; input: { playerVisible: boolean; playerVisibleFields: string[] } },
      ctx: Context,
    ) => {
      const role = await getCampaignRole(ctx, campaignId);
      if (role !== 'GM') throw new Error('Only the GM can change visibility');
      const result = await ctx.prisma.nPC.update({
        where: { id },
        data: {
          playerVisible: input.playerVisible,
          playerVisibleFields: input.playerVisibleFields,
        },
      });
      publishCampaignEvent(campaignId, 'NPC', result.id, 'UPDATED');
      return result;
    },
  },

  NPC: {
    locationPresences: async (npc: { id: string; campaignId: string }, _: unknown, ctx: Context) => {
      const presences = await ctx.prisma.nPCLocationPresence.findMany({
        where: { npcId: npc.id },
        include: { location: true },
      });
      const role = await getCampaignRole(ctx, npc.campaignId);
      if (role === 'PLAYER') {
        return presences.filter((p) => p.location.playerVisible);
      }
      return presences;
    },
    groupMemberships: async (npc: { id: string; campaignId: string }, _: unknown, ctx: Context) => {
      const memberships = await ctx.prisma.nPCGroupMembership.findMany({ where: { npcId: npc.id }, include: { group: true } });
      const role = await getCampaignRole(ctx, npc.campaignId);
      // For players, only show memberships in visible groups
      if (role === 'PLAYER') {
        return memberships.filter((m) => m.group.playerVisible);
      }
      return memberships;
    },
    sessions: async (npc: { id: string; campaignId: string; playerVisibleFields?: string[] }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, npc.campaignId);
      if (role === 'PLAYER') return [];
      const links = await ctx.prisma.sessionNPC.findMany({ where: { npcId: npc.id }, include: { session: true } });
      return links.map((l) => l.session);
    },
    questsGiven: async (npc: { id: string; campaignId: string }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, npc.campaignId);
      const quests = await ctx.prisma.quest.findMany({ where: { giverId: npc.id } });
      if (role === 'PLAYER') {
        return quests.filter((q) => q.playerVisible);
      }
      return quests;
    },
  },
};
