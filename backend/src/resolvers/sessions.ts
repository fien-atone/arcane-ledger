import type { Context } from '../context.js';
import { getCampaignRole } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { redactEntity, SESSION_FIELDS } from './redact.js';

export const sessionResolvers = {
  Query: {
    sessions: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const sessions = await ctx.prisma.session.findMany({ where: { campaignId }, orderBy: { number: 'desc' } });
      const role = await getCampaignRole(ctx, campaignId);
      // Sessions always fully visible to all — only summary (legacy GM notes) is hidden from players
      if (role === 'PLAYER') {
        return sessions.map((s) => ({ ...s, summary: '' }));
      }
      return sessions;
    },

    session: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const entity = await ctx.prisma.session.findFirst({ where: { id, campaignId } });
      if (!entity) return null;
      const role = await getCampaignRole(ctx, campaignId);
      if (role === 'PLAYER') {
        return { ...entity, summary: '' };
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

    saveSessionNote: async (
      _: unknown,
      { sessionId, content }: { sessionId: string; content: string },
      ctx: Context,
    ) => {
      if (!ctx.user) throw new Error('Not authenticated');
      // Verify session exists and get campaignId for subscription event
      const session = await ctx.prisma.session.findUniqueOrThrow({ where: { id: sessionId } });
      const note = await ctx.prisma.sessionNote.upsert({
        where: { sessionId_userId: { sessionId, userId: ctx.user.id } },
        create: { sessionId, userId: ctx.user.id, content },
        update: { content },
      });
      publishCampaignEvent(session.campaignId, 'SESSION_NOTE', note.id, 'UPDATED');
      return note;
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

    myNote: async (session: { id: string }, _: unknown, ctx: Context) => {
      if (!ctx.user) return null;
      return ctx.prisma.sessionNote.findUnique({
        where: { sessionId_userId: { sessionId: session.id, userId: ctx.user.id } },
      });
    },
  },
};
