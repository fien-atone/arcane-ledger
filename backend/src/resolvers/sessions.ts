import type { Context } from '../context.js';

export const sessionResolvers = {
  Query: {
    sessions: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.session.findMany({ where: { campaignId }, orderBy: { number: 'desc' } }),

    session: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.session.findFirst({ where: { id, campaignId } }),
  },

  Mutation: {
    saveSession: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { number: number; title: string; datetime?: string; brief?: string; summary?: string; npcIds?: string[]; locationIds?: string[]; questIds?: string[] } },
      { prisma }: Context,
    ) => {
      const data = {
        number: input.number,
        title: input.title,
        datetime: input.datetime ?? '',
        brief: input.brief ?? null,
        summary: input.summary ?? '',
      };

      let session;
      if (id) {
        session = await prisma.session.update({ where: { id }, data });
      } else {
        session = await prisma.session.create({ data: { ...data, campaignId } });
      }

      // Sync junction tables only when the array was explicitly provided (not undefined)
      const sessionId = session.id;

      if (input.npcIds !== undefined) {
        await prisma.sessionNPC.deleteMany({ where: { sessionId } });
        if (input.npcIds?.length) {
          await prisma.sessionNPC.createMany({
            data: input.npcIds.map((npcId) => ({ sessionId, npcId })),
          });
        }
      }

      if (input.locationIds !== undefined) {
        await prisma.sessionLocation.deleteMany({ where: { sessionId } });
        if (input.locationIds?.length) {
          await prisma.sessionLocation.createMany({
            data: input.locationIds.map((locationId) => ({ sessionId, locationId })),
          });
        }
      }

      if (input.questIds !== undefined) {
        await prisma.sessionQuest.deleteMany({ where: { sessionId } });
        if (input.questIds?.length) {
          await prisma.sessionQuest.createMany({
            data: input.questIds.map((questId) => ({ sessionId, questId })),
          });
        }
      }

      return session;
    },

    deleteSession: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.session.delete({ where: { id } });
      return true;
    },
  },

  Session: {
    npcs: async (session: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionNPC.findMany({ where: { sessionId: session.id }, include: { npc: true } });
      return links.map((l) => l.npc);
    },
    locations: async (session: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionLocation.findMany({ where: { sessionId: session.id }, include: { location: true } });
      return links.map((l) => l.location);
    },
    quests: async (session: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionQuest.findMany({ where: { sessionId: session.id }, include: { quest: true } });
      return links.map((l) => l.quest);
    },
  },
};
