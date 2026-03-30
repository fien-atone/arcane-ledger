import type { Context } from '../context.js';
import { toEnum } from './utils.js';
import { publishCampaignEvent } from '../publish.js';

export const npcResolvers = {
  Query: {
    npcs: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.nPC.findMany({ where: { campaignId } }),

    npc: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.nPC.findFirst({ where: { id, campaignId } }),
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
  },

  NPC: {
    locationPresences: (npc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCLocationPresence.findMany({ where: { npcId: npc.id }, include: { location: true } }),
    groupMemberships: (npc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCGroupMembership.findMany({ where: { npcId: npc.id }, include: { group: true } }),
    sessions: async (npc: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionNPC.findMany({ where: { npcId: npc.id }, include: { session: true } });
      return links.map((l) => l.session);
    },
    questsGiven: (npc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.quest.findMany({ where: { giverId: npc.id } }),
  },
};
