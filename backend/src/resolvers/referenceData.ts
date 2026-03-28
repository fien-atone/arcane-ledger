import type { Context } from '../context.js';

export const referenceDataResolvers = {
  Query: {
    locationTypes: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.locationType.findMany(),

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

    species: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.species.findMany(),
  },

  Mutation: {
    saveLocationType: async (
      _: unknown,
      args: { id?: string; name: string; icon: string; category: string; biomeOptions?: string[]; isSettlement?: boolean },
      { prisma }: Context,
    ) => {
      const data = {
        name: args.name,
        icon: args.icon,
        category: args.category,
        biomeOptions: args.biomeOptions ?? [],
        isSettlement: args.isSettlement ?? false,
      };

      if (args.id) {
        return prisma.locationType.update({ where: { id: args.id }, data });
      }
      return prisma.locationType.create({ data });
    },

    deleteLocationType: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      await prisma.locationType.delete({ where: { id } });
      return true;
    },

    saveContainmentRule: async (
      _: unknown,
      args: { id?: string; parentTypeId: string; childTypeId: string },
      { prisma }: Context,
    ) => {
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

    deleteContainmentRule: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      await prisma.locationTypeContainmentRule.delete({ where: { id } });
      return true;
    },

    saveGroupType: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; icon?: string; description?: string },
      { prisma }: Context,
    ) => {
      const data = {
        name: args.name,
        icon: args.icon ?? 'groups',
        description: args.description ?? null,
      };

      if (args.id) {
        return prisma.groupType.update({ where: { id: args.id }, data });
      }
      return prisma.groupType.create({ data: { ...data, campaignId: args.campaignId } });
    },

    deleteGroupType: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      await prisma.groupType.delete({ where: { id } });
      return true;
    },

    saveSpecies: async (
      _: unknown,
      args: { id?: string; name: string; pluralName?: string; type: string; size: string; description?: string; traits?: string[]; image?: string },
      { prisma }: Context,
    ) => {
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
        return prisma.species.update({ where: { id: args.id }, data });
      }
      return prisma.species.create({ data });
    },

    deleteSpecies: async (_: unknown, { id }: { id: string }, { prisma }: Context) => {
      await prisma.species.delete({ where: { id } });
      return true;
    },
  },
};
