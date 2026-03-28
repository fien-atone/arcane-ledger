import type { Context } from '../context.js';
import { toEnum } from './utils.js';

export const questResolvers = {
  Query: {
    quests: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.quest.findMany({ where: { campaignId } }),

    quest: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.quest.findFirst({ where: { id, campaignId } }),
  },

  Mutation: {
    saveQuest: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { title: string; description?: string; giverId?: string; reward?: string; status?: string; notes?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        title: input.title,
        description: input.description ?? '',
        giverId: input.giverId ?? null,
        reward: input.reward ?? null,
        status: toEnum(input.status, 'UNDISCOVERED'),
        notes: input.notes ?? '',
      };

      if (id) {
        return prisma.quest.update({ where: { id }, data });
      }
      return prisma.quest.create({ data: { ...data, campaignId } });
    },

    deleteQuest: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.quest.delete({ where: { id } });
      return true;
    },
  },

  Quest: {
    giver: (quest: { giverId: string | null }, _: unknown, { prisma }: Context) =>
      quest.giverId ? prisma.nPC.findUnique({ where: { id: quest.giverId } }) : null,
    sessions: async (quest: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionQuest.findMany({ where: { questId: quest.id }, include: { session: true } });
      return links.map((l) => l.session);
    },
  },
};
