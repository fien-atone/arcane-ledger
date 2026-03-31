import type { Context } from '../context.js';
import { getCampaignRole } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { redactEntity, LOCATION_FIELDS } from './redact.js';

export const locationResolvers = {
  Query: {
    locations: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const where = role === 'PLAYER'
        ? { campaignId, playerVisible: true as const }
        : { campaignId };
      const locations = await ctx.prisma.location.findMany({ where });
      if (role === 'PLAYER') {
        return locations.map((loc) => redactEntity(loc, loc.playerVisibleFields, LOCATION_FIELDS));
      }
      return locations;
    },

    location: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      const entity = await ctx.prisma.location.findFirst({ where: { id, campaignId } });
      if (!entity) return null;
      const role = await getCampaignRole(ctx, campaignId);
      if (role === 'PLAYER') {
        if (!entity.playerVisible) return null;
        return redactEntity(entity, entity.playerVisibleFields, LOCATION_FIELDS);
      }
      return entity;
    },
  },

  Mutation: {
    saveLocation: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; aliases?: string[]; type: string; settlementPopulation?: number; biome?: string; parentLocationId?: string; description?: string; image?: string; gmNotes?: string; mapMarkers?: string } },
      { prisma }: Context,
    ) => {
      const data: Record<string, unknown> = {
        name: input.name,
        aliases: input.aliases ?? [],
        type: input.type || null,
        settlementPopulation: input.settlementPopulation ?? null,
        biome: input.biome ?? null,
        parentLocationId: input.parentLocationId ?? null,
        description: input.description ?? '',
        gmNotes: input.gmNotes ?? null,
        mapMarkers: input.mapMarkers ? JSON.parse(input.mapMarkers) : [],
      };
      if (input.image !== undefined) data.image = input.image ?? null;

      if (id) {
        const result = await prisma.location.update({ where: { id }, data });
        publishCampaignEvent(campaignId, 'LOCATION', result.id, 'UPDATED');
        return result;
      }
      const result = await prisma.location.create({ data: { ...data, campaignId } });
      publishCampaignEvent(campaignId, 'LOCATION', result.id, 'CREATED');
      return result;
    },

    deleteLocation: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.location.delete({ where: { id } });
      publishCampaignEvent(campaignId, 'LOCATION', id, 'DELETED');
      return true;
    },

    setLocationVisibility: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id: string; input: { playerVisible: boolean; playerVisibleFields: string[] } },
      ctx: Context,
    ) => {
      const role = await getCampaignRole(ctx, campaignId);
      if (role !== 'GM') throw new Error('Only the GM can change visibility');
      const result = await ctx.prisma.location.update({
        where: { id },
        data: {
          playerVisible: input.playerVisible,
          playerVisibleFields: input.playerVisibleFields,
        },
      });
      publishCampaignEvent(campaignId, 'LOCATION', result.id, 'UPDATED');
      return result;
    },
  },

  Location: {
    parentLocation: (loc: { parentLocationId: string | null }, _: unknown, { prisma }: Context) =>
      loc.parentLocationId ? prisma.location.findUnique({ where: { id: loc.parentLocationId } }) : null,
    children: async (loc: { id: string; campaignId: string; playerVisibleFields?: string[] }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, loc.campaignId);
      if (role === 'PLAYER' && !(loc.playerVisibleFields ?? []).includes('children')) {
        return [];
      }
      const children = await ctx.prisma.location.findMany({ where: { parentLocationId: loc.id } });
      // For players, filter out hidden child locations
      if (role === 'PLAYER') {
        return children.filter((c) => c.playerVisible);
      }
      return children;
    },
    npcsHere: async (loc: { id: string; campaignId: string; playerVisibleFields?: string[] }, _: unknown, ctx: Context) => {
      const role = await getCampaignRole(ctx, loc.campaignId);
      if (role === 'PLAYER' && !(loc.playerVisibleFields ?? []).includes('npcsHere')) {
        return [];
      }
      const presences = await ctx.prisma.nPCLocationPresence.findMany({ where: { locationId: loc.id }, include: { npc: true } });
      // For players, filter out hidden NPCs
      if (role === 'PLAYER') {
        return presences.filter((p) => p.npc.playerVisible).map((p) => p.npc);
      }
      return presences.map((p) => p.npc);
    },
    mapMarkers: (loc: { mapMarkers: unknown }) => {
      if (typeof loc.mapMarkers === 'string') return JSON.parse(loc.mapMarkers);
      return loc.mapMarkers ?? [];
    },
  },
};
