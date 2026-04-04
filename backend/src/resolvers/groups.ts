import type { Context } from '../context.js';
import { publishCampaignEvent } from '../publish.js';
import { getCampaignRole } from './utils.js';
import { redactEntity, GROUP_FIELDS } from './redact.js';

export const groupResolvers = {
  Query: {
    groups: async (_: unknown, { campaignId, search, type }: { campaignId: string; search?: string; type?: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const isPlayer = role === 'PLAYER';
      const groups = await ctx.prisma.group.findMany({
        where: {
          campaignId,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
          ...(type ? { type } : {}),
          ...(isPlayer ? { playerVisible: true } : {}),
        },
        orderBy: { name: 'asc' },
      });
      if (isPlayer) {
        return groups.map((g) => redactEntity(g, g.playerVisibleFields, GROUP_FIELDS));
      }
      return groups;
    },

    group: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const isPlayer = role === 'PLAYER';
      const group = await ctx.prisma.group.findFirst({ where: { id, campaignId } });
      if (!group) return null;
      if (isPlayer && !group.playerVisible) return null;
      if (isPlayer) {
        return redactEntity(group, group.playerVisibleFields, GROUP_FIELDS);
      }
      return group;
    },
  },

  Mutation: {
    saveGroup: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; type: string; aliases?: string[]; description?: string; goals?: string; symbols?: string; gmNotes?: string; partyRelation?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        name: input.name,
        type: input.type || null,
        aliases: input.aliases ?? [],
        description: input.description ?? '',
        goals: input.goals ?? null,
        symbols: input.symbols ?? null,
        gmNotes: input.gmNotes ?? null,
        partyRelation: input.partyRelation ?? null,
      };

      if (id) {
        const result = await prisma.group.update({ where: { id }, data });
        publishCampaignEvent(campaignId, 'GROUP', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.group.create({ data: { ...data, campaignId } });
      publishCampaignEvent(campaignId, 'GROUP', result.id, 'CREATED');
      return result;
    },

    deleteGroup: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.group.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'GROUP', id, 'DELETED');
      return true;
    },

    setGroupVisibility: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id: string; input: { playerVisible: boolean; playerVisibleFields: string[] } },
      ctx: Context,
    ) => {
      const role = await getCampaignRole(ctx, campaignId);
      if (role !== 'GM') throw new Error('Only the GM can change visibility');
      const result = await ctx.prisma.group.update({
        where: { id },
        data: {
          playerVisible: input.playerVisible,
          playerVisibleFields: input.playerVisibleFields,
        },
      });
      publishCampaignEvent(campaignId, 'GROUP', result.id, 'UPDATED');
      return result;
    },
  },

  Group: {
    members: (group: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCGroupMembership.findMany({ where: { groupId: group.id } }),
  },
};
