import type { Context } from '../context.js';

export const locationResolvers = {
  Query: {
    locations: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.location.findMany({ where: { campaignId } }),

    location: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.location.findFirst({ where: { id, campaignId } }),
  },

  Mutation: {
    saveLocation: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; aliases?: string[]; type: string; settlementPopulation?: number; biome?: string; parentLocationId?: string; description?: string; image?: string; gmNotes?: string; mapMarkers?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        name: input.name,
        aliases: input.aliases ?? [],
        type: input.type,
        settlementPopulation: input.settlementPopulation ?? null,
        biome: input.biome ?? null,
        parentLocationId: input.parentLocationId ?? null,
        description: input.description ?? '',
        image: input.image ?? null,
        gmNotes: input.gmNotes ?? null,
        mapMarkers: input.mapMarkers ? JSON.parse(input.mapMarkers) : [],
      };

      if (id) {
        return prisma.location.update({ where: { id }, data });
      }
      return prisma.location.create({ data: { ...data, campaignId } });
    },

    deleteLocation: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.location.delete({ where: { id } });
      return true;
    },
  },

  Location: {
    parentLocation: (loc: { parentLocationId: string | null }, _: unknown, { prisma }: Context) =>
      loc.parentLocationId ? prisma.location.findUnique({ where: { id: loc.parentLocationId } }) : null,
    children: (loc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.location.findMany({ where: { parentLocationId: loc.id } }),
    npcsHere: async (loc: { id: string }, _: unknown, { prisma }: Context) => {
      const presences = await prisma.nPCLocationPresence.findMany({ where: { locationId: loc.id }, include: { npc: true } });
      return presences.map((p) => p.npc);
    },
    mapMarkers: (loc: { mapMarkers: unknown }) => {
      if (typeof loc.mapMarkers === 'string') return JSON.parse(loc.mapMarkers);
      return loc.mapMarkers ?? [];
    },
  },
};
