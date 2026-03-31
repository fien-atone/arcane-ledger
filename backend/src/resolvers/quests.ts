import type { Context } from '../context.js';
import { toEnum, getCampaignRole } from './utils.js';
import { publishCampaignEvent } from '../publish.js';

export const questResolvers = {
  Query: {
    quests: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const isPlayer = role === 'PLAYER';
      return ctx.prisma.quest.findMany({
        where: { campaignId, ...(isPlayer ? { playerVisible: true } : {}) },
      });
    },

    quest: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const isPlayer = role === 'PLAYER';
      const quest = await ctx.prisma.quest.findFirst({ where: { id, campaignId } });
      if (!quest) return null;
      if (isPlayer && !quest.playerVisible) return null;
      return quest;
    },
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
        const result = await prisma.quest.update({ where: { id }, data });
        publishCampaignEvent(campaignId, 'QUEST', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.quest.create({ data: { ...data, campaignId } });
      publishCampaignEvent(campaignId, 'QUEST', result.id, 'CREATED');
      return result;
    },

    deleteQuest: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.quest.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'QUEST', id, 'DELETED');
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
