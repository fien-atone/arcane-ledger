/**
 * NPC Functional Tests
 *
 * Tests the complete NPC lifecycle: create, read, update, delete.
 * Also covers NPC-Location presence (junction table) and NPC-Group membership
 * management, verifying that many-to-many relationships are correctly created
 * and removed through dedicated mutations.
 *
 * Prerequisites: seeded campaign and GM user in database.
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
  CAMPAIGN_ID,
} from '../helpers.js';

let request: Agent;
let prisma: PrismaClient;
let cleanup: () => Promise<void>;
let gmToken: string;

const uid = Date.now();
let createdNpcId: string;
let locationId: string;
let groupId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);

  // Create a location and group for presence/membership tests
  const locRes = await graphql(
    request,
    `mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
      saveLocation(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `NpcTestLoc ${uid}` } },
    gmToken,
  );
  locationId = (locRes.data!.saveLocation as Record<string, string>).id;

  const grpRes = await graphql(
    request,
    `mutation SaveGroup($campaignId: ID!, $input: GroupInput!) {
      saveGroup(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `NpcTestGrp ${uid}` } },
    gmToken,
  );
  groupId = (grpRes.data!.saveGroup as Record<string, string>).id;
});

afterAll(async () => {
  // Clean up
  await prisma.nPC.delete({ where: { id: createdNpcId } }).catch(() => {});
  await prisma.location.delete({ where: { id: locationId } }).catch(() => {});
  await prisma.group.delete({ where: { id: groupId } }).catch(() => {});
  await cleanup();
});

const NPC_FIELDS = `id campaignId name aliases status gender age species appearance personality description motivation flaws gmNotes`;

describe('NPCs', () => {
  it('rejects creating an NPC with empty name', async () => {
    // Backend must validate that name is non-empty (GraphQL String! only
    // forbids null, not empty string). Empty/whitespace names should be
    // rejected with BAD_USER_INPUT error.
    const res = await graphql(
      request,
      `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { id }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: { name: '' },
      },
      gmToken,
    );
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(res.errors?.[0]?.message).toMatch(/required/i);
  });

  it('rejects creating an NPC with whitespace-only name', async () => {
    const res = await graphql(
      request,
      `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { id }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: { name: '   ' },
      },
      gmToken,
    );
    expect(res.errors).toBeDefined();
    expect(res.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
  });

  it('creates an NPC with generated UUID and correct campaignId', async () => {
    // Create a new NPC via saveNPC mutation.
    // Verify: server generates UUID (not client), campaignId matches,
    // all provided fields (name, status, gender, age) are stored correctly.
    const res = await graphql(
      request,
      `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { ${NPC_FIELDS} }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: { name: `TestNPC ${uid}`, status: 'ALIVE', gender: 'MALE', age: 35 },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npc = res.data!.saveNPC as Record<string, unknown>;
    expect(npc.id).toBeDefined();
    expect(npc.campaignId).toBe(CAMPAIGN_ID);
    expect(npc.name).toBe(`TestNPC ${uid}`);
    expect(npc.status).toBe('ALIVE');
    expect(npc.gender).toBe('MALE');
    expect(npc.age).toBe(35);
    createdNpcId = npc.id as string;
  });

  it('lists NPCs for campaign and includes created NPC', async () => {
    // Query all NPCs for the campaign and verify the newly created NPC appears.
    // Confirms the list query correctly scopes to campaignId.
    const res = await graphql(
      request,
      `query NPCs($campaignId: ID!) {
        npcs(campaignId: $campaignId) { id name }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npcs = res.data!.npcs as Array<Record<string, unknown>>;
    const found = npcs.find((n) => n.id === createdNpcId);
    expect(found).toBeDefined();
    expect(found!.name).toBe(`TestNPC ${uid}`);
  });

  it('updates NPC fields', async () => {
    // Update multiple NPC fields (name, status, appearance, personality) via saveNPC with an ID.
    // Verify: the upsert pattern correctly updates an existing NPC rather than creating a new one.
    const res = await graphql(
      request,
      `mutation SaveNPC($campaignId: ID!, $id: ID, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, id: $id, input: $input) { ${NPC_FIELDS} }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdNpcId,
        input: {
          name: `UpdatedNPC ${uid}`,
          status: 'DEAD',
          appearance: 'Scarred face',
          personality: 'Brooding',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npc = res.data!.saveNPC as Record<string, unknown>;
    expect(npc.name).toBe(`UpdatedNPC ${uid}`);
    expect(npc.status).toBe('DEAD');
    expect(npc.appearance).toBe('Scarred face');
    expect(npc.personality).toBe('Brooding');
  });

  it('adds NPC to location (presence)', async () => {
    // Step 1: Add NPC presence at a location with a note.
    // This creates a junction record (NPCLocationPresence) linking the NPC to the location.
    // Step 2: Verify the presence appears in the NPC's locationPresences
    // and includes the location details and the note.
    const res = await graphql(
      request,
      `mutation AddPresence($npcId: ID!, $locationId: ID!, $note: String) {
        addNPCLocationPresence(npcId: $npcId, locationId: $locationId, note: $note) {
          id locationPresences { locationId location { name } note }
        }
      }`,
      { npcId: createdNpcId, locationId, note: 'Lives here' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npc = res.data!.addNPCLocationPresence as Record<string, unknown>;
    const presences = npc.locationPresences as Array<Record<string, unknown>>;
    const found = presences.find((p) => p.locationId === locationId);
    expect(found).toBeDefined();
    expect(found!.note).toBe('Lives here');
  });

  it('removes NPC from location', async () => {
    // Remove the NPC-Location presence junction record.
    // Verify: the location no longer appears in the NPC's locationPresences array.
    const res = await graphql(
      request,
      `mutation RemovePresence($npcId: ID!, $locationId: ID!) {
        removeNPCLocationPresence(npcId: $npcId, locationId: $locationId) {
          id locationPresences { locationId }
        }
      }`,
      { npcId: createdNpcId, locationId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npc = res.data!.removeNPCLocationPresence as Record<string, unknown>;
    const presences = npc.locationPresences as Array<Record<string, unknown>>;
    const found = presences.find((p) => p.locationId === locationId);
    expect(found).toBeUndefined();
  });

  it('adds NPC to group (membership)', async () => {
    // Add NPC to a group with a relation label (e.g., "Leader").
    // This creates a junction record (NPCGroupMembership) linking the NPC to the group.
    // Verify: the membership appears with the correct group details and relation text.
    const res = await graphql(
      request,
      `mutation AddMembership($npcId: ID!, $groupId: ID!, $relation: String) {
        addNPCGroupMembership(npcId: $npcId, groupId: $groupId, relation: $relation) {
          id groupMemberships { groupId group { name } relation }
        }
      }`,
      { npcId: createdNpcId, groupId, relation: 'Leader' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npc = res.data!.addNPCGroupMembership as Record<string, unknown>;
    const memberships = npc.groupMemberships as Array<Record<string, unknown>>;
    const found = memberships.find((m) => m.groupId === groupId);
    expect(found).toBeDefined();
    expect(found!.relation).toBe('Leader');
  });

  it('removes NPC from group', async () => {
    // Remove the NPC-Group membership junction record.
    // Verify: the group no longer appears in the NPC's groupMemberships array.
    const res = await graphql(
      request,
      `mutation RemoveMembership($npcId: ID!, $groupId: ID!) {
        removeNPCGroupMembership(npcId: $npcId, groupId: $groupId) {
          id groupMemberships { groupId }
        }
      }`,
      { npcId: createdNpcId, groupId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const npc = res.data!.removeNPCGroupMembership as Record<string, unknown>;
    const memberships = npc.groupMemberships as Array<Record<string, unknown>>;
    const found = memberships.find((m) => m.groupId === groupId);
    expect(found).toBeUndefined();
  });

  it('filters npcs by search (name, case-insensitive partial match)', async () => {
    // Server-side search by name. Should NOT match aliases (per product
    // decision: alias search is too noisy). Case-insensitive substring
    // match over `name` only.
    const uniqueMarker = `SrchNpc${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $input: NPCInput!) { saveNPC(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Alpha`, aliases: ['ZZZ_only_in_alias'] } },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $input: NPCInput!) { saveNPC(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Beta` } },
      gmToken,
    );
    const aId = (a.data!.saveNPC as Record<string, string>).id;
    const bId = (b.data!.saveNPC as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { npcs(campaignId: $campaignId, search: $search) { id name } }`,
      { campaignId: CAMPAIGN_ID, search: uniqueMarker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const npcs = res.data!.npcs as Array<Record<string, string>>;
    const ids = npcs.map((n) => n.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    // Alias-only search should NOT find the NPC
    const aliasRes = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { npcs(campaignId: $campaignId, search: $search) { id } }`,
      { campaignId: CAMPAIGN_ID, search: 'ZZZ_only_in_alias' },
      gmToken,
    );
    const aliasNpcs = aliasRes.data!.npcs as Array<Record<string, string>>;
    expect(aliasNpcs.find((n) => n.id === aId)).toBeUndefined();

    // Narrower search returns just one
    const narrow = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { npcs(campaignId: $campaignId, search: $search) { id name } }`,
      { campaignId: CAMPAIGN_ID, search: `${uniqueMarker} Alpha` },
      gmToken,
    );
    const narrowNpcs = narrow.data!.npcs as Array<Record<string, string>>;
    expect(narrowNpcs.map((n) => n.id)).toContain(aId);
    expect(narrowNpcs.map((n) => n.id)).not.toContain(bId);

    await prisma.nPC.delete({ where: { id: aId } }).catch(() => {});
    await prisma.nPC.delete({ where: { id: bId } }).catch(() => {});
  });

  it('filters npcs by status (server-side, uppercase-normalized)', async () => {
    // Server accepts case-insensitive status and normalizes to UPPER for the
    // DB enum. Only NPCs matching the given status should be returned.
    const uniqueMarker = `StatNpc${uid}`;
    const aliveRes = await graphql(
      request,
      `mutation($campaignId: ID!, $input: NPCInput!) { saveNPC(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Alive`, status: 'ALIVE' } },
      gmToken,
    );
    const deadRes = await graphql(
      request,
      `mutation($campaignId: ID!, $input: NPCInput!) { saveNPC(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Dead`, status: 'DEAD' } },
      gmToken,
    );
    const aliveId = (aliveRes.data!.saveNPC as Record<string, string>).id;
    const deadId = (deadRes.data!.saveNPC as Record<string, string>).id;

    // Request with lowercase status — resolver should normalize
    const res = await graphql(
      request,
      `query($campaignId: ID!, $status: String) { npcs(campaignId: $campaignId, status: $status) { id status } }`,
      { campaignId: CAMPAIGN_ID, status: 'alive' },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const npcs = res.data!.npcs as Array<Record<string, string>>;
    expect(npcs.find((n) => n.id === aliveId)).toBeDefined();
    expect(npcs.find((n) => n.id === deadId)).toBeUndefined();
    // All returned rows have status ALIVE
    expect(npcs.every((n) => n.status === 'ALIVE')).toBe(true);

    await prisma.nPC.delete({ where: { id: aliveId } }).catch(() => {});
    await prisma.nPC.delete({ where: { id: deadId } }).catch(() => {});
  });

  it('returns all npcs for campaign when no search or status is provided', async () => {
    // Baseline: without filters, the resolver returns all NPCs scoped to
    // the campaign (existing behaviour must be preserved).
    const res = await graphql(
      request,
      `query($campaignId: ID!) { npcs(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const npcs = res.data!.npcs as Array<Record<string, string>>;
    expect(Array.isArray(npcs)).toBe(true);
  });

  it('deletes NPC and it no longer appears in list', async () => {
    // Step 1: Delete the NPC via deleteNPC mutation, verify it returns true.
    // Step 2: Re-query the NPC list and confirm the deleted NPC is gone.
    // This tests hard deletion (not soft-delete/archive).
    const delRes = await graphql(
      request,
      `mutation DeleteNPC($campaignId: ID!, $id: ID!) {
        deleteNPC(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: createdNpcId },
      gmToken,
    );
    expect(delRes.errors).toBeUndefined();
    expect(delRes.data!.deleteNPC).toBe(true);

    const listRes = await graphql(
      request,
      `query NPCs($campaignId: ID!) {
        npcs(campaignId: $campaignId) { id }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    const npcs = listRes.data!.npcs as Array<Record<string, unknown>>;
    expect(npcs.find((n) => n.id === createdNpcId)).toBeUndefined();

    // Mark as deleted so afterAll doesn't fail
    createdNpcId = '';
  });
});
