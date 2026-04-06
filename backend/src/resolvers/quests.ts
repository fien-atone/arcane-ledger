import type { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { toEnum, getCampaignRole, requireGM } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { redactEntity, QUEST_FIELDS } from './redact.js';

export const questResolvers = {
  Query: {
    quests: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const isPlayer = role === 'PLAYER';
      const quests = await ctx.prisma.quest.findMany({
        where: { campaignId, ...(isPlayer ? { playerVisible: true } : {}) },
        orderBy: { title: 'asc' },
      });
      if (isPlayer) {
        return quests.map((q) => redactEntity(q, q.playerVisibleFields, QUEST_FIELDS));
      }
      return quests;
    },

    quest: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const isPlayer = role === 'PLAYER';
      const quest = await ctx.prisma.quest.findFirst({ where: { id, campaignId } });
      if (!quest) return null;
      if (isPlayer && !quest.playerVisible) return null;
      if (isPlayer) {
        return redactEntity(quest, quest.playerVisibleFields, QUEST_FIELDS);
      }
      return quest;
    },
  },

  Mutation: {
    saveQuest: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { title: string; description?: string; giverId?: string; reward?: string; status?: string; notes?: string } },
      ctx: Context,
    ) => {
      await requireGM(ctx, campaignId);
      const { prisma } = ctx;
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

    deleteQuest: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      await requireGM(ctx, campaignId);
      const { prisma } = ctx;
      await prisma.quest.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'QUEST', id, 'DELETED');
      return true;
    },

    setQuestVisibility: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id: string; input: { playerVisible: boolean; playerVisibleFields: string[] } },
      ctx: Context,
    ) => {
      const role = await getCampaignRole(ctx, campaignId);
      if (role !== 'GM') throw new GraphQLError('Only the GM can change visibility', { extensions: { code: 'FORBIDDEN' } });
      const result = await ctx.prisma.quest.update({
        where: { id },
        data: {
          playerVisible: input.playerVisible,
          playerVisibleFields: input.playerVisibleFields,
        },
      });
      publishCampaignEvent(campaignId, 'QUEST', result.id, 'UPDATED');
      return result;
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
