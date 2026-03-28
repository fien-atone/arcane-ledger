import type { Context } from '../context.js';

export const relationResolvers = {
  Query: {
    relationsForEntity: (_: unknown, { campaignId, entityId }: { campaignId: string; entityId: string }, { prisma }: Context) =>
      prisma.relation.findMany({
        where: {
          campaignId,
          OR: [{ fromEntityId: entityId }, { toEntityId: entityId }],
        },
      }),

    relationsForCampaign: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.relation.findMany({ where: { campaignId } }),
  },

  Mutation: {
    saveRelation: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { fromEntityType: string; fromEntityId: string; toEntityType: string; toEntityId: string; friendliness: number; note?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        fromEntityType: input.fromEntityType,
        fromEntityId: input.fromEntityId,
        toEntityType: input.toEntityType,
        toEntityId: input.toEntityId,
        friendliness: input.friendliness,
        note: input.note ?? null,
      };

      if (id) {
        return prisma.relation.update({ where: { id }, data });
      }

      // Upsert by unique composite key
      return prisma.relation.upsert({
        where: {
          campaignId_fromEntityType_fromEntityId_toEntityType_toEntityId: {
            campaignId,
            fromEntityType: input.fromEntityType,
            fromEntityId: input.fromEntityId,
            toEntityType: input.toEntityType,
            toEntityId: input.toEntityId,
          },
        },
        update: { friendliness: input.friendliness, note: input.note ?? null },
        create: { ...data, campaignId },
      });
    },

    deleteRelation: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      await prisma.relation.delete({ where: { id } });
      return true;
    },
  },

  Relation: {
    fromEntity: (rel: { fromEntityType: string; fromEntityId: string }) => ({
      type: rel.fromEntityType,
      id: rel.fromEntityId,
    }),
    toEntity: (rel: { toEntityType: string; toEntityId: string }) => ({
      type: rel.toEntityType,
      id: rel.toEntityId,
    }),
  },
};
