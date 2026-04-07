import type { Context } from '../context.js';
import { requireGM } from './utils.js';
import { publishCampaignEvent } from '../publish.js';

export const referenceDataResolvers = {
  Query: {
    locationTypes: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.locationType.findMany({ where: { campaignId }, orderBy: { name: 'asc' } }),

    containmentRules: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.locationTypeContainmentRule.findMany(),

    groupTypes: (_: unknown, { campaignId, search }: { campaignId: string; search?: string }, { prisma }: Context) =>
      prisma.groupType.findMany({
        where: {
          campaignId,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
        },
        orderBy: { name: 'asc' },
      }),

    speciesTypes: (_: unknown, { campaignId, search }: { campaignId: string; search?: string }, { prisma }: Context) =>
      prisma.speciesType.findMany({
        where: {
          campaignId,
          ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
        },
        orderBy: { name: 'asc' },
      }),

    species: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.species.findMany({ where: { campaignId }, orderBy: { name: 'asc' } }),
  },

  Mutation: {
    saveLocationType: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; icon: string; category: string; biomeOptions?: string[]; isSettlement?: boolean },
      ctx: Context,
    ) => {
      await requireGM(ctx, args.campaignId);
      const { prisma } = ctx;
      const data = {
        name: args.name,
        icon: args.icon,
        category: args.category,
        biomeOptions: args.biomeOptions ?? [],
        isSettlement: args.isSettlement ?? false,
      };

      if (args.id) {
        const result = await prisma.locationType.update({ where: { id: args.id }, data });
        publishCampaignEvent(args.campaignId, 'LOCATION_TYPE', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.locationType.create({ data: { ...data, campaignId: args.campaignId } });
      publishCampaignEvent(args.campaignId, 'LOCATION_TYPE', result.id, 'CREATED');
      return result;
    },

    deleteLocationType: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma } = ctx;
      const entity = await prisma.locationType.findUniqueOrThrow({ where: { id } });
      await requireGM(ctx, entity.campaignId);
      await prisma.locationType.delete({ where: { id } });
      publishCampaignEvent(entity.campaignId, 'LOCATION_TYPE', id, 'DELETED');
      return true;
    },

    saveContainmentRule: async (
      _: unknown,
      args: { id?: string; parentTypeId: string; childTypeId: string },
      ctx: Context,
    ) => {
      const { prisma } = ctx;
      // Look up the parent type to get campaignId for authorization
      const parentType = await prisma.locationType.findUniqueOrThrow({ where: { id: args.parentTypeId } });
      await requireGM(ctx, parentType.campaignId);

      const data = { parentTypeId: args.parentTypeId, childTypeId: args.childTypeId };

      if (args.id) {
        return prisma.locationTypeContainmentRule.update({ where: { id: args.id }, data });
      }

      // Upsert by unique composite key
      return prisma.locationTypeContainmentRule.upsert({
        where: {
          parentTypeId_childTypeId: {
            parentTypeId: args.parentTypeId,
            childTypeId: args.childTypeId,
          },
        },
        update: data,
        create: data,
      });
    },

    deleteContainmentRule: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma } = ctx;
      const rule = await prisma.locationTypeContainmentRule.findUniqueOrThrow({ where: { id }, include: { parentType: true } });
      await requireGM(ctx, rule.parentType.campaignId);
      await prisma.locationTypeContainmentRule.delete({ where: { id } });
      return true;
    },

    saveGroupType: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; icon?: string; description?: string },
      ctx: Context,
    ) => {
      await requireGM(ctx, args.campaignId);
      const { prisma } = ctx;
      const data = {
        name: args.name,
        icon: args.icon ?? 'groups',
        description: args.description ?? null,
      };

      if (args.id) {
        const result = await prisma.groupType.update({ where: { id: args.id }, data });
        publishCampaignEvent(args.campaignId, 'GROUP_TYPE', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.groupType.create({ data: { ...data, campaignId: args.campaignId } });
      publishCampaignEvent(args.campaignId, 'GROUP_TYPE', result.id, 'CREATED');
      return result;
    },

    deleteGroupType: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma } = ctx;
      const entity = await prisma.groupType.findUniqueOrThrow({ where: { id } });
      await requireGM(ctx, entity.campaignId);
      await prisma.groupType.delete({ where: { id } });
      publishCampaignEvent(entity.campaignId, 'GROUP_TYPE', id, 'DELETED');
      return true;
    },

    saveSpeciesType: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; icon?: string; description?: string },
      ctx: Context,
    ) => {
      await requireGM(ctx, args.campaignId);
      const { prisma } = ctx;
      const data = { name: args.name, icon: args.icon ?? 'blur_on', description: args.description ?? null };
      if (args.id) {
        const result = await prisma.speciesType.update({ where: { id: args.id }, data });
        publishCampaignEvent(args.campaignId, 'SPECIES_TYPE', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.speciesType.create({ data: { ...data, campaignId: args.campaignId } });
      publishCampaignEvent(args.campaignId, 'SPECIES_TYPE', result.id, 'CREATED');
      return result;
    },

    deleteSpeciesType: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma } = ctx;
      const entity = await prisma.speciesType.findUniqueOrThrow({ where: { id } });
      await requireGM(ctx, entity.campaignId);
      await prisma.speciesType.delete({ where: { id } });
      publishCampaignEvent(entity.campaignId, 'SPECIES_TYPE', id, 'DELETED');
      return true;
    },

    saveSpecies: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; pluralName?: string; type: string; size: string; description?: string; traits?: string[]; image?: string },
      ctx: Context,
    ) => {
      await requireGM(ctx, args.campaignId);
      const { prisma } = ctx;
      const data = {
        name: args.name,
        pluralName: args.pluralName ?? null,
        type: args.type,
        size: args.size,
        description: args.description ?? null,
        traits: args.traits ?? [],
        image: args.image ?? null,
      };

      if (args.id) {
        const result = await prisma.species.update({ where: { id: args.id }, data });
        publishCampaignEvent(args.campaignId, 'SPECIES', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.species.create({ data: { ...data, campaignId: args.campaignId } });
      publishCampaignEvent(args.campaignId, 'SPECIES', result.id, 'CREATED');
      return result;
    },

    deleteSpecies: async (_: unknown, { id }: { id: string }, ctx: Context) => {
      const { prisma } = ctx;
      const entity = await prisma.species.findUniqueOrThrow({ where: { id } });
      await requireGM(ctx, entity.campaignId);
      await prisma.species.delete({ where: { id } });
      publishCampaignEvent(entity.campaignId, 'SPECIES', id, 'DELETED');
      return true;
    },
  },
};
