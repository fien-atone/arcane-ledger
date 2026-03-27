import type { Context } from '../context.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../auth/middleware.js';

export const resolvers = {
  Query: {
    me: (_: unknown, __: unknown, { user }: Context) => user,

    campaigns: async (_: unknown, __: unknown, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const members = await prisma.campaignMember.findMany({
        where: { userId: user.id },
        include: { campaign: true },
      });
      return members.map((m) => ({ ...m.campaign, myRole: m.role }));
    },

    campaign: async (_: unknown, { id }: { id: string }, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const member = await prisma.campaignMember.findUnique({
        where: { campaignId_userId: { campaignId: id, userId: user.id } },
        include: { campaign: true },
      });
      if (!member) throw new Error('Not found');
      return { ...member.campaign, myRole: member.role };
    },

    sessions: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.session.findMany({ where: { campaignId }, orderBy: { number: 'desc' } }),

    session: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.session.findFirst({ where: { id, campaignId } }),

    npcs: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.nPC.findMany({ where: { campaignId } }),

    npc: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.nPC.findFirst({ where: { id, campaignId } }),

    party: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.playerCharacter.findMany({ where: { campaignId } }),

    quests: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.quest.findMany({ where: { campaignId } }),

    quest: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.quest.findFirst({ where: { id, campaignId } }),

    groups: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.group.findMany({ where: { campaignId } }),

    group: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.group.findFirst({ where: { id, campaignId } }),

    locations: (_: unknown, { campaignId }: { campaignId: string }, { prisma }: Context) =>
      prisma.location.findMany({ where: { campaignId } }),

    location: (_: unknown, { campaignId, id }: { campaignId: string; id: string }, { prisma }: Context) =>
      prisma.location.findFirst({ where: { id, campaignId } }),

    locationTypes: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.locationType.findMany(),

    containmentRules: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.locationTypeContainmentRule.findMany(),

    groupTypes: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.groupType.findMany(),

    species: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.species.findMany(),

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
    login: async (_: unknown, { email, password }: { email: string; password: string }, { prisma }: Context) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !await bcrypt.compare(password, user.password)) {
        throw new Error('Invalid credentials');
      }
      return { token: signToken(user.id), user };
    },

    createCampaign: async (_: unknown, { title, description }: { title: string; description?: string }, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const campaign = await prisma.campaign.create({
        data: {
          title,
          description,
          members: { create: { userId: user.id, role: 'GM' } },
        },
      });
      return { ...campaign, myRole: 'GM' };
    },

    updateCampaign: async (_: unknown, args: { id: string; title?: string; description?: string; archivedAt?: string }, { prisma }: Context) => {
      return prisma.campaign.update({
        where: { id: args.id },
        data: {
          ...(args.title !== undefined && { title: args.title }),
          ...(args.description !== undefined && { description: args.description }),
          ...(args.archivedAt !== undefined && { archivedAt: args.archivedAt ? new Date(args.archivedAt) : null }),
        },
      });
    },

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
      if (id) {
        session = await prisma.session.update({ where: { id }, data });
      } else {
        session = await prisma.session.create({ data: { ...data, campaignId } });
      }

      // Sync junction tables: delete old links, create new ones
      const sessionId = session.id;

      await prisma.sessionNPC.deleteMany({ where: { sessionId } });
      if (input.npcIds?.length) {
        await prisma.sessionNPC.createMany({
          data: input.npcIds.map((npcId) => ({ sessionId, npcId })),
        });
      }

      await prisma.sessionLocation.deleteMany({ where: { sessionId } });
      if (input.locationIds?.length) {
        await prisma.sessionLocation.createMany({
          data: input.locationIds.map((locationId) => ({ sessionId, locationId })),
        });
      }

      await prisma.sessionQuest.deleteMany({ where: { sessionId } });
      if (input.questIds?.length) {
        await prisma.sessionQuest.createMany({
          data: input.questIds.map((questId) => ({ sessionId, questId })),
        });
      }

      return session;
    },

    deleteSession: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.session.delete({ where: { id } });
      return true;
    },

    saveNPC: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { name: string; aliases?: string[]; status?: string; gender?: string; age?: number; species?: string; speciesId?: string; appearance?: string; personality?: string; description?: string; motivation?: string; flaws?: string; gmNotes?: string; image?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        name: input.name,
        aliases: input.aliases ?? [],
        status: (input.status as any) ?? 'ALIVE',
        gender: (input.gender as any) ?? null,
        age: input.age ?? null,
        species: input.species ?? null,
        speciesId: input.speciesId ?? null,
        appearance: input.appearance ?? null,
        personality: input.personality ?? null,
        description: input.description ?? '',
        motivation: input.motivation ?? null,
        flaws: input.flaws ?? null,
        gmNotes: input.gmNotes ?? null,
        image: input.image ?? null,
      };

      if (id) {
        return prisma.nPC.update({ where: { id }, data });
      }
      return prisma.nPC.create({ data: { ...data, campaignId } });
    },

    deleteNPC: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.nPC.delete({ where: { id } });
      return true;
    },

    saveQuest: async (
      _: unknown,
      { campaignId, id, input }: { campaignId: string; id?: string; input: { title: string; description?: string; giverId?: string; reward?: string; status?: string; notes?: string } },
      { prisma }: Context,
    ) => {
      const data = {
        title: input.title,
        description: input.description ?? '',
        giverId: input.giverId ?? null,
        reward: input.reward ?? null,
        status: (input.status as any) ?? 'UNDISCOVERED',
        notes: input.notes ?? '',
      };

      if (id) {
        return prisma.quest.update({ where: { id }, data });
      }
      return prisma.quest.create({ data: { ...data, campaignId } });
    },

    deleteQuest: async (_: unknown, { id }: { campaignId: string; id: string }, { prisma }: Context) => {
      await prisma.quest.delete({ where: { id } });
      return true;
    },

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
      args: { id?: string; name: string; icon?: string; description?: string },
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
      return prisma.groupType.create({ data });
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

    saveCharacter: async (
      _: unknown,
      args: { campaignId: string; id?: string; name: string; gender?: string; age?: number; species?: string; speciesId?: string; class?: string; appearance?: string; background?: string; personality?: string; motivation?: string; bonds?: string; flaws?: string; gmNotes?: string; image?: string },
      { prisma, user }: Context,
    ) => {
      if (!user) throw new Error('Not authenticated');

      const data = {
        name: args.name,
        gender: (args.gender as any) ?? null,
        age: args.age ?? null,
        species: args.species ?? null,
        speciesId: args.speciesId ?? null,
        class: args.class ?? null,
        appearance: args.appearance ?? null,
        background: args.background ?? null,
        personality: args.personality ?? null,
        motivation: args.motivation ?? null,
        bonds: args.bonds ?? null,
        flaws: args.flaws ?? null,
        gmNotes: args.gmNotes ?? '',
        image: args.image ?? null,
      };

      if (args.id) {
        return prisma.playerCharacter.update({ where: { id: args.id }, data });
      }
      return prisma.playerCharacter.create({ data: { ...data, campaignId: args.campaignId, userId: user.id } });
    },

    addNPCLocationPresence: async (
      _: unknown,
      { npcId, locationId, note }: { npcId: string; locationId: string; note?: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCLocationPresence.upsert({
        where: { npcId_locationId: { npcId, locationId } },
        update: { note: note ?? null },
        create: { npcId, locationId, note: note ?? null },
      });
      return prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
    },

    removeNPCLocationPresence: async (
      _: unknown,
      { npcId, locationId }: { npcId: string; locationId: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCLocationPresence.delete({
        where: { npcId_locationId: { npcId, locationId } },
      });
      return prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
    },

    addNPCGroupMembership: async (
      _: unknown,
      { npcId, groupId, relation, subfaction }: { npcId: string; groupId: string; relation?: string; subfaction?: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCGroupMembership.upsert({
        where: { npcId_groupId: { npcId, groupId } },
        update: { relation: relation ?? null, subfaction: subfaction ?? null },
        create: { npcId, groupId, relation: relation ?? null, subfaction: subfaction ?? null },
      });
      return prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
    },

    removeNPCGroupMembership: async (
      _: unknown,
      { npcId, groupId }: { npcId: string; groupId: string },
      { prisma }: Context,
    ) => {
      await prisma.nPCGroupMembership.delete({
        where: { npcId_groupId: { npcId, groupId } },
      });
      return prisma.nPC.findUniqueOrThrow({ where: { id: npcId } });
    },
  },

  // ── Field resolvers ─────────────────────────────────────────

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

  Campaign: {
    sessionCount: (campaign: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.session.count({ where: { campaignId: campaign.id } }),
    memberCount: (campaign: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.campaignMember.count({ where: { campaignId: campaign.id } }),
    lastSession: (campaign: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.session.findFirst({ where: { campaignId: campaign.id }, orderBy: { number: 'desc' } }),
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
  },

  NPC: {
    locationPresences: (npc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCLocationPresence.findMany({ where: { npcId: npc.id }, include: { location: true } }),
    groupMemberships: (npc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCGroupMembership.findMany({ where: { npcId: npc.id }, include: { group: true } }),
    sessions: async (npc: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionNPC.findMany({ where: { npcId: npc.id }, include: { session: true } });
      return links.map((l) => l.session);
    },
    questsGiven: (npc: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.quest.findMany({ where: { giverId: npc.id } }),
  },

  Group: {
    members: (group: { id: string }, _: unknown, { prisma }: Context) =>
      prisma.nPCGroupMembership.findMany({ where: { groupId: group.id }, include: { npc: true } }),
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

  Quest: {
    giver: (quest: { giverId: string | null }, _: unknown, { prisma }: Context) =>
      quest.giverId ? prisma.nPC.findUnique({ where: { id: quest.giverId } }) : null,
    sessions: async (quest: { id: string }, _: unknown, { prisma }: Context) => {
      const links = await prisma.sessionQuest.findMany({ where: { questId: quest.id }, include: { session: true } });
      return links.map((l) => l.session);
    },
  },
};
