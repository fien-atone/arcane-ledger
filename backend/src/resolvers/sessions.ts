import type { Context } from '../context.js';
import { getCampaignRole } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { redactEntity, SESSION_FIELDS } from './redact.js';

export const sessionResolvers = {
  Query: {
    sessions: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const where = role === 'PLAYER'
        ? { campaignId, playerVisible: true as const }
        : { campaignId };
      const sessions = await ctx.prisma.session.findMany({ where, orderBy: { number: 'desc' } });
      if (role === 'PLAYER') {
        return sessions.map((s) => redactEntity(s, s.playerVisibleFields, SESSION_FIELDS));
      }
      return sessions;
    },

    session: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const entity = await ctx.prisma.session.findFirst({ where: { id, campaignId } });
      if (!entity) return null;
      const role = await getCampaignRole(ctx, campaignId);
      if (role === 'PLAYER') {
        if (!entity.playerVisible) return null;
        return redactEntity(entity, entity.playerVisibleFields, SESSION_FIELDS);
      }
      return entity;
    },
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
      const isCreate = !id;
      if (id) {
        session = await prisma.session.update({ where: { id }, data });
      } else {
        session = await prisma.session.create({ data: { ...data, campaignId } });
      }
      publishCampaignEvent(campaignId, 'SESSION', session.id, isCreate ? 'CREATED' : 'UPDATED');

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

    deleteSession: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.session.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'SESSION', id, 'DELETED');
      return true;
    },

    setSessionVisibility: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id: string; input: { playerVisible: boolean; playerVisibleFields: string[] } },
      ctx: Context,
    ) => {
      const role = await getCampaignRole(ctx, campaignId);
      if (role !== 'GM') throw new Error('Only the GM can change visibility');
      const result = await ctx.prisma.session.update({
        where: { id },
        data: {
          playerVisible: input.playerVisible,
          playerVisibleFields: input.playerVisibleFields,
        },
      });
      publishCampaignEvent(campaignId, 'SESSION', result.id, 'UPDATED');
      return result;
    },
  },

  Session: {
    npcs: async (session: { id: string; campaignId: string; playerVisibleFields?: string[] }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, session.campaignId);
      if (role === 'PLAYER' && !(session.playerVisibleFields ?? []).includes('npcs')) {
        return [];
      }
      const links = await ctx.prisma.sessionNPC.findMany({ where: { sessionId: session.id }, include: { npc: true } });
      // For players, filter out hidden NPCs
      if (role === 'PLAYER') {
        return links.filter((l) => l.npc.playerVisible).map((l) => l.npc);
      }
      return links.map((l) => l.npc);
    },
    locations: async (session: { id: string; campaignId: string; playerVisibleFields?: string[] }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, session.campaignId);
      if (role === 'PLAYER' && !(session.playerVisibleFields ?? []).includes('locations')) {
        return [];
      }
      const links = await ctx.prisma.sessionLocation.findMany({ where: { sessionId: session.id }, include: { location: true } });
      // For players, filter out hidden locations
      if (role === 'PLAYER') {
        return links.filter((l) => l.location.playerVisible).map((l) => l.location);
      }
      return links.map((l) => l.location);
    },
    quests: async (session: { id: string; campaignId: string; playerVisibleFields?: string[] }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, session.campaignId);
      if (role === 'PLAYER' && !(session.playerVisibleFields ?? []).includes('quests')) {
        return [];
      }
      const links = await ctx.prisma.sessionQuest.findMany({ where: { sessionId: session.id }, include: { quest: true } });
      return links.map((l) => l.quest);
    },
  },
};
