/**
 * Visibility Functional Tests
 *
 * Tests the GM-controlled visibility system for NPCs, locations, quests, and groups.
 * The GM can toggle playerVisible on/off and specify which fields are visible via
 * playerVisibleFields. When an entity is hidden, players cannot see it in lists or
 * by direct query. When visible, only whitelisted fields show real data -- other
 * string fields are redacted to empty strings, and nullable fields (like gmNotes)
 * remain null. The GM always sees all entities and all fields regardless of settings.
 *
 * Prerequisites: seeded campaign, GM user, and player user in database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Agent } from 'supertest';
import type { PrismaClient } from '@prisma/client';
import {
  getTestApp,
  loginAs,
  graphql,
  GM_EMAIL,
  GM_PASSWORD,
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
  CAMPAIGN_ID,
} from '../helpers.js';

let request: Agent;
let prisma: PrismaClient;
let cleanup: () => Promise<void>;
let gmToken: string;
let playerToken: string;

const uid = Date.now();
let npcId: string;
let locationId: string;
let questId: string;
let groupId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
  playerToken = await loginAs(request, PLAYER_EMAIL, PLAYER_PASSWORD);

  // Create entities for visibility tests — all start as playerVisible: false (default)
  const npcRes = await graphql(
    request,
    `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
      saveNPC(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `VisNPC ${uid}`, appearance: 'Mysterious', personality: 'Calm' } },
    gmToken,
  );
  npcId = (npcRes.data!.saveNPC as Record<string, string>).id;

  const locRes = await graphql(
    request,
    `mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
      saveLocation(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `VisLoc ${uid}`, description: 'A hidden grove' } },
    gmToken,
  );
  locationId = (locRes.data!.saveLocation as Record<string, string>).id;

  const questRes = await graphql(
    request,
    `mutation SaveQuest($campaignId: ID!, $input: QuestInput!) {
      saveQuest(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { title: `VisQuest ${uid}`, description: 'Find the artifact', reward: '1000gp' } },
    gmToken,
  );
  questId = (questRes.data!.saveQuest as Record<string, string>).id;

  const groupRes = await graphql(
    request,
    `mutation SaveGroup($campaignId: ID!, $input: GroupInput!) {
      saveGroup(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `VisGroup ${uid}`, description: 'Shadow guild', goals: 'Domination' } },
    gmToken,
  );
  groupId = (groupRes.data!.saveGroup as Record<string, string>).id;
});

afterAll(async () => {
  await prisma.nPC.delete({ where: { id: npcId } }).catch(() => {});
  await prisma.location.delete({ where: { id: locationId } }).catch(() => {});
  await prisma.quest.delete({ where: { id: questId } }).catch(() => {});
  await prisma.group.delete({ where: { id: groupId } }).catch(() => {});
  await cleanup();
});

describe('Visibility', () => {
  it('hidden NPC is not visible to player', async () => {
    // NPCs default to playerVisible: false when created.
    // Verify: player's NPC list query does not include the hidden NPC.
    const res = await graphql(
      request,
      `query NPCs($campaignId: ID!) {
        npcs(campaignId: $campaignId) { id name }
      }`,
      { campaignId: CAMPAIGN_ID },
      playerToken,
    );

    expect(res.errors).toBeUndefined();
    const npcs = res.data!.npcs as Array<Record<string, unknown>>;
    expect(npcs.find((n) => n.id === npcId)).toBeUndefined();
  });

  it('sets NPC visibility and player can see it', async () => {
    // Step 1: GM makes the NPC visible with only 'appearance' in playerVisibleFields.
    // Step 2: Player queries the NPC directly.
    // Verify: name is always visible (identity field), appearance shows real data,
    // personality is redacted to empty string (not in visible fields),
    // gmNotes stays null (GM-only nullable field, never exposed to players).
    const setRes = await graphql(
      request,
      `mutation SetNPCVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setNPCVisibility(campaignId: $campaignId, id: $id, input: $input) {
          id playerVisible playerVisibleFields
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: npcId,
        input: { playerVisible: true, playerVisibleFields: ['appearance'] },
      },
      gmToken,
    );
    expect(setRes.errors).toBeUndefined();
    const updated = setRes.data!.setNPCVisibility as Record<string, unknown>;
    expect(updated.playerVisible).toBe(true);
    expect(updated.playerVisibleFields).toContain('appearance');

    // Player should now see the NPC with only allowed fields
    const playerRes = await graphql(
      request,
      `query NPC($campaignId: ID!, $id: ID!) {
        npc(campaignId: $campaignId, id: $id) {
          id name appearance personality gmNotes
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: npcId },
      playerToken,
    );
    expect(playerRes.errors).toBeUndefined();
    const npc = playerRes.data!.npc as Record<string, unknown>;
    expect(npc).not.toBeNull();
    expect(npc.name).toBe(`VisNPC ${uid}`); // always visible
    expect(npc.appearance).toBe('Mysterious'); // in playerVisibleFields
    expect(npc.personality).toBe(''); // not in playerVisibleFields -> redacted
    expect(npc.gmNotes).toBeNull(); // never visible, nullable field stays null
  });

  it('sets NPC visibility back to hidden', async () => {
    // Toggle the NPC back to hidden (playerVisible: false).
    // Verify: the NPC disappears from the player's list query again.
    await graphql(
      request,
      `mutation SetNPCVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setNPCVisibility(campaignId: $campaignId, id: $id, input: $input) { id playerVisible }
      }`,
      { campaignId: CAMPAIGN_ID, id: npcId, input: { playerVisible: false, playerVisibleFields: [] } },
      gmToken,
    );

    const playerRes = await graphql(
      request,
      `query NPCs($campaignId: ID!) { npcs(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      playerToken,
    );
    const npcs = playerRes.data!.npcs as Array<Record<string, unknown>>;
    expect(npcs.find((n) => n.id === npcId)).toBeUndefined();
  });

  it('sets location visibility', async () => {
    // Same visibility pattern as NPC, applied to a location.
    // Verify: player sees name (always) and description (whitelisted),
    // but gmNotes stays null (GM-only). Then hide it again for cleanup.
    const setRes = await graphql(
      request,
      `mutation SetLocationVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setLocationVisibility(campaignId: $campaignId, id: $id, input: $input) {
          id playerVisible playerVisibleFields
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: locationId,
        input: { playerVisible: true, playerVisibleFields: ['description'] },
      },
      gmToken,
    );
    expect(setRes.errors).toBeUndefined();

    // Player sees it with only description field
    const playerRes = await graphql(
      request,
      `query Location($campaignId: ID!, $id: ID!) {
        location(campaignId: $campaignId, id: $id) {
          id name description gmNotes
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: locationId },
      playerToken,
    );
    const loc = playerRes.data!.location as Record<string, unknown>;
    expect(loc).not.toBeNull();
    expect(loc.name).toBe(`VisLoc ${uid}`);
    expect(loc.description).toBe('A hidden grove');
    expect(loc.gmNotes).toBeNull(); // never visible, nullable field stays null

    // Hide again
    await graphql(
      request,
      `mutation SetLocationVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setLocationVisibility(campaignId: $campaignId, id: $id, input: $input) { id }
      }`,
      { campaignId: CAMPAIGN_ID, id: locationId, input: { playerVisible: false, playerVisibleFields: [] } },
      gmToken,
    );
  });

  it('sets quest visibility', async () => {
    // Same visibility pattern as NPC, applied to a quest.
    // Verify: player sees title (always) and description (whitelisted),
    // but reward is redacted to empty string (not whitelisted). Then hide again.
    const setRes = await graphql(
      request,
      `mutation SetQuestVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setQuestVisibility(campaignId: $campaignId, id: $id, input: $input) {
          id playerVisible playerVisibleFields
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: questId,
        input: { playerVisible: true, playerVisibleFields: ['description'] },
      },
      gmToken,
    );
    expect(setRes.errors).toBeUndefined();

    // Player sees quest with only description
    const playerRes = await graphql(
      request,
      `query Quest($campaignId: ID!, $id: ID!) {
        quest(campaignId: $campaignId, id: $id) {
          id title description reward
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: questId },
      playerToken,
    );
    const quest = playerRes.data!.quest as Record<string, unknown>;
    expect(quest).not.toBeNull();
    expect(quest.title).toBe(`VisQuest ${uid}`); // always visible
    expect(quest.description).toBe('Find the artifact'); // in visible fields
    expect(quest.reward).toBe(''); // not in visible fields -> redacted

    // Hide again
    await graphql(
      request,
      `mutation SetQuestVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setQuestVisibility(campaignId: $campaignId, id: $id, input: $input) { id }
      }`,
      { campaignId: CAMPAIGN_ID, id: questId, input: { playerVisible: false, playerVisibleFields: [] } },
      gmToken,
    );
  });

  it('sets group visibility', async () => {
    // Same visibility pattern as NPC, applied to a group.
    // Verify: player sees name (always) and description (whitelisted),
    // but goals is redacted and gmNotes stays null. Then hide again.
    const setRes = await graphql(
      request,
      `mutation SetGroupVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setGroupVisibility(campaignId: $campaignId, id: $id, input: $input) {
          id playerVisible playerVisibleFields
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: groupId,
        input: { playerVisible: true, playerVisibleFields: ['description'] },
      },
      gmToken,
    );
    expect(setRes.errors).toBeUndefined();

    // Player sees group with description but not goals
    const playerRes = await graphql(
      request,
      `query Group($campaignId: ID!, $id: ID!) {
        group(campaignId: $campaignId, id: $id) {
          id name description goals gmNotes
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: groupId },
      playerToken,
    );
    const group = playerRes.data!.group as Record<string, unknown>;
    expect(group).not.toBeNull();
    expect(group.name).toBe(`VisGroup ${uid}`);
    expect(group.description).toBe('Shadow guild');
    expect(group.goals).toBe(''); // not in visible fields
    expect(group.gmNotes).toBeNull(); // never visible, nullable field stays null

    // Hide again
    await graphql(
      request,
      `mutation SetGroupVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
        setGroupVisibility(campaignId: $campaignId, id: $id, input: $input) { id }
      }`,
      { campaignId: CAMPAIGN_ID, id: groupId, input: { playerVisible: false, playerVisibleFields: [] } },
      gmToken,
    );
  });

  it('player query returns only visible entities', async () => {
    // Comprehensive cross-entity test: explicitly hide all test entities,
    // then query all four entity lists as the player in parallel.
    // Verify: none of the test entities appear in any of the player's lists.
    await Promise.all([
      graphql(request, `mutation($c: ID!, $id: ID!, $i: SetEntityVisibilityInput!) { setNPCVisibility(campaignId: $c, id: $id, input: $i) { id } }`, { c: CAMPAIGN_ID, id: npcId, i: { playerVisible: false, playerVisibleFields: [] } }, gmToken),
      graphql(request, `mutation($c: ID!, $id: ID!, $i: SetEntityVisibilityInput!) { setLocationVisibility(campaignId: $c, id: $id, input: $i) { id } }`, { c: CAMPAIGN_ID, id: locationId, i: { playerVisible: false, playerVisibleFields: [] } }, gmToken),
      graphql(request, `mutation($c: ID!, $id: ID!, $i: SetEntityVisibilityInput!) { setQuestVisibility(campaignId: $c, id: $id, input: $i) { id } }`, { c: CAMPAIGN_ID, id: questId, i: { playerVisible: false, playerVisibleFields: [] } }, gmToken),
      graphql(request, `mutation($c: ID!, $id: ID!, $i: SetEntityVisibilityInput!) { setGroupVisibility(campaignId: $c, id: $id, input: $i) { id } }`, { c: CAMPAIGN_ID, id: groupId, i: { playerVisible: false, playerVisibleFields: [] } }, gmToken),
    ]);

    // All entities hidden — player should not see any of our test entities
    const [npcRes, locRes, questRes, groupRes] = await Promise.all([
      graphql(request, `query($c: ID!) { npcs(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, playerToken),
      graphql(request, `query($c: ID!) { locations(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, playerToken),
      graphql(request, `query($c: ID!) { quests(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, playerToken),
      graphql(request, `query($c: ID!) { groups(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, playerToken),
    ]);

    const npcIds = (npcRes.data!.npcs as Array<Record<string, unknown>>).map((n) => n.id);
    const locIds = (locRes.data!.locations as Array<Record<string, unknown>>).map((l) => l.id);
    const questIds = (questRes.data!.quests as Array<Record<string, unknown>>).map((q) => q.id);
    const groupIds = (groupRes.data!.groups as Array<Record<string, unknown>>).map((g) => g.id);

    expect(npcIds).not.toContain(npcId);
    expect(locIds).not.toContain(locationId);
    expect(questIds).not.toContain(questId);
    expect(groupIds).not.toContain(groupId);
  });

  it('GM query returns all entities regardless of visibility', async () => {
    // Query all four entity lists as the GM while all test entities are still hidden.
    // Verify: GM sees every entity regardless of playerVisible setting.
    // This confirms the visibility filter is only applied to non-GM users.
    const [npcRes, locRes, questRes, groupRes] = await Promise.all([
      graphql(request, `query($c: ID!) { npcs(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, gmToken),
      graphql(request, `query($c: ID!) { locations(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, gmToken),
      graphql(request, `query($c: ID!) { quests(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, gmToken),
      graphql(request, `query($c: ID!) { groups(campaignId: $c) { id } }`, { c: CAMPAIGN_ID }, gmToken),
    ]);

    const npcIds = (npcRes.data!.npcs as Array<Record<string, unknown>>).map((n) => n.id);
    const locIds = (locRes.data!.locations as Array<Record<string, unknown>>).map((l) => l.id);
    const questIds = (questRes.data!.quests as Array<Record<string, unknown>>).map((q) => q.id);
    const groupIds = (groupRes.data!.groups as Array<Record<string, unknown>>).map((g) => g.id);

    expect(npcIds).toContain(npcId);
    expect(locIds).toContain(locationId);
    expect(questIds).toContain(questId);
    expect(groupIds).toContain(groupId);
  });
});
