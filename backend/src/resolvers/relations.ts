import type { Context } from '../context.js';
import { requireGM } from './utils.js';
import { publishCampaignEvent } from '../publish.js';

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
      ctx: Context,
    ) => {
      await requireGM(ctx, campaignId);
      const { prisma } = ctx;
      const data = {
        fromEntityType: input.fromEntityType,
        fromEntityId: input.fromEntityId,
        toEntityType: input.toEntityType,
        toEntityId: input.toEntityId,
        friendliness: input.friendliness,
        note: input.note ?? null,
      };

      if (id) {
        const result = await prisma.relation.update({ where: { id }, data });
        publishCampaignEvent(campaignId, 'RELATION', result.id, 'UPDATED');
        return result;
      }

      // Upsert by unique composite key
      const result = await prisma.relation.upsert({
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
      publishCampaignEvent(campaignId, 'RELATION', result.id, 'CREATED');
      return result;
    },

    deleteRelation: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma } = ctx;
      const entity = await prisma.relation.findUniqueOrThrow({ where: { id } });
      await requireGM(ctx, entity.campaignId);
      await prisma.relation.delete({ where: { id } });
      publishCampaignEvent(entity.campaignId, 'RELATION', id, 'DELETED');
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
