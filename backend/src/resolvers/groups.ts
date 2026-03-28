import type { Context } from '../context.js';

export const groupResolvers = {
  Query: {
    groups: (_: unknown, { campaignId, search, type }: { campaignId: string; search?: string; type?: string }, { prisma }: Context) =>
      prisma.group.findMany({
        where: {
          campaignId,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
          ...(type ? { type } : {}),
        },
        orderBy: { name: 'asc' },
      }),

    group: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.group.findFirst({ where: { id, campaignId } }),
  },

  Mutation: {
    saveGroup: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; type: string; aliases?: string[]; description?: string; goals?: string; symbols?: string; gmNotes?: string; partyRelation?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        name: input.name,
        type: input.type,
        aliases: input.aliases ?? [],
        description: input.description ?? '',
        goals: input.goals ?? null,
        symbols: input.symbols ?? null,
        gmNotes: input.gmNotes ?? null,
        partyRelation: input.partyRelation ?? null,
      };

      if (id) {
        return prisma.group.update({ where: { id }, data });
      }
      return prisma.group.create({ data: { ...data, campaignId } });
    },

    deleteGroup: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.group.delete({ where: { id } });
      return true;
    },
  },

  Group: {
    members: (group: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCGroupMembership.findMany({ where: { groupId: group.id }, include: { npc: true } }),
  },
};
