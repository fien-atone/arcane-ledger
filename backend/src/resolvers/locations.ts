import type { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { getCampaignRole, requireGM } from './utils.js';
import { publishCampaignEvent } from '../publish.js';
import { redactEntity, LOCATION_FIELDS } from './redact.js';

export const locationResolvers = {
  Query: {
    locations: async (_: unknown, { campaignId }: { campaignId: string }, ctx: Context) => {
      const role = await getCampaignRole(ctx, campaignId);
      const where = role === 'PLAYER'
        ? { campaignId, playerVisible: true as const }
        : { campaignId };
      const locations = await ctx.prisma.location.findMany({ where, orderBy: { name: 'asc' } });
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
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; type: string; settlementPopulation?: number; biome?: string; parentLocationId?: string; description?: string; image?: string; gmNotes?: string; mapMarkers?: string } },
      ctx: Context,
    ) => {
      await requireGM(ctx, campaignId);
      const { prisma } = ctx;
      const data: Record<string, unknown> = {
        name: input.name,
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
      const result = await prisma.location.create({ data: { ...data, campaignId } as any });
      publishCampaignEvent(campaignId, 'LOCATION', result.id, 'CREATED');
      return result;
    },

    deleteLocation: async (_: unknown, { campaignId, id }: { campaignId: string; id: string }, ctx: Context) => {
      await requireGM(ctx, campaignId);
      const { prisma } = ctx;
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
      if (role !== 'GM') throw new GraphQLError('Only the GM can change visibility', { extensions: { code: 'FORBIDDEN' } });
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
      // Use DataLoader to batch sibling .children() calls into one query
      const children = await ctx.loaders.locationChildren.load(loc.id);
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
    mapMarkers: async (loc: { mapMarkers: unknown; campaignId: string }, _: unknown, ctx: Context) => {
      const raw = typeof loc.mapMarkers === 'string' ? JSON.parse(loc.mapMarkers) : (loc.mapMarkers ?? []);
      const role = await getCampaignRole(ctx, loc.campaignId);
      if (role !== 'PLAYER') return raw;
      // Filter out markers linked to hidden locations
      const markers = raw as { id: string; linkedLocationId?: string; [k: string]: unknown }[];
      if (markers.length === 0) return [];
      const linkedLocIds = markers.map((m) => m.linkedLocationId).filter(Boolean) as string[];
      if (linkedLocIds.length === 0) return markers;
      const visibleLocs = await ctx.prisma.location.findMany({
        where: { id: { in: linkedLocIds }, playerVisible: true },
        select: { id: true },
      });
      const visibleSet = new Set(visibleLocs.map((l) => l.id));
      return markers.filter((m) => !m.linkedLocationId || visibleSet.has(m.linkedLocationId));
    },
  },
};
