/**
 * Quest Functional Tests
 *
 * Tests the complete quest lifecycle: create, status transitions, linking to an NPC
 * as quest giver, and delete. Verifies that quest status can transition through
 * the full lifecycle (ACTIVE -> COMPLETED -> FAILED) and that the giver relation
 * correctly resolves the linked NPC.
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
let createdQuestId: string;
let npcId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);

  // Create an NPC for quest giver test
  const npcRes = await graphql(
    request,
    `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
      saveNPC(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `QuestGiverNPC ${uid}` } },
    gmToken,
  );
  npcId = (npcRes.data!.saveNPC as Record<string, string>).id;
});

afterAll(async () => {
  if (createdQuestId) await prisma.quest.delete({ where: { id: createdQuestId } }).catch(() => {});
  await prisma.nPC.delete({ where: { id: npcId } }).catch(() => {});
  await cleanup();
});

describe('Quests', () => {
  it('creates a quest with status', async () => {
    // Create a new quest with title, description, status, and reward.
    // Verify: server generates UUID, campaignId matches, all fields persist correctly,
    // and status is stored as the UPPERCASE enum value.
    const res = await graphql(
      request,
      `mutation SaveQuest($campaignId: ID!, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, input: $input) {
          id campaignId title description status reward notes
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: {
          title: `TestQuest ${uid}`,
          description: 'Find the lost amulet',
          status: 'ACTIVE',
          reward: '500 gold',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const quest = res.data!.saveQuest as Record<string, unknown>;
    expect(quest.id).toBeDefined();
    expect(quest.campaignId).toBe(CAMPAIGN_ID);
    expect(quest.title).toBe(`TestQuest ${uid}`);
    expect(quest.status).toBe('ACTIVE');
    expect(quest.reward).toBe('500 gold');
    createdQuestId = quest.id as string;
  });

  it('updates quest status through lifecycle', async () => {
    // Test that quest status can transition through the full lifecycle.
    // The system does not enforce specific transitions -- any status can change to any other.

    // Step 1: ACTIVE -> COMPLETED
    const completedRes = await graphql(
      request,
      `mutation SaveQuest($campaignId: ID!, $id: ID, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, id: $id, input: $input) { id status }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdQuestId,
        input: { title: `TestQuest ${uid}`, status: 'COMPLETED' },
      },
      gmToken,
    );
    expect(completedRes.errors).toBeUndefined();
    expect((completedRes.data!.saveQuest as Record<string, unknown>).status).toBe('COMPLETED');

    // Step 2: COMPLETED -> FAILED
    const failedRes = await graphql(
      request,
      `mutation SaveQuest($campaignId: ID!, $id: ID, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, id: $id, input: $input) { id status }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdQuestId,
        input: { title: `TestQuest ${uid}`, status: 'FAILED' },
      },
      gmToken,
    );
    expect(failedRes.errors).toBeUndefined();
    expect((failedRes.data!.saveQuest as Record<string, unknown>).status).toBe('FAILED');
  });

  it('sets quest giver (NPC link)', async () => {
    // Link an NPC as the quest giver via the giverId field.
    // Verify: giverId is stored, and the giver field resolver returns the NPC's full details.
    const res = await graphql(
      request,
      `mutation SaveQuest($campaignId: ID!, $id: ID, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, id: $id, input: $input) {
          id giverId giver { id name }
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdQuestId,
        input: { title: `TestQuest ${uid}`, giverId: npcId },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const quest = res.data!.saveQuest as Record<string, unknown>;
    expect(quest.giverId).toBe(npcId);
    const giver = quest.giver as Record<string, unknown>;
    expect(giver.id).toBe(npcId);
  });

  it('filters quests by search (title, case-insensitive partial match)', async () => {
    // Server-side search by title. Case-insensitive substring match over
    // `title` only — description is NOT searched.
    const uniqueMarker = `SrchQst${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $input: QuestInput!) { saveQuest(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { title: `${uniqueMarker} Alpha`, description: 'ZZZ_only_in_desc' } },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $input: QuestInput!) { saveQuest(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { title: `${uniqueMarker} Beta` } },
      gmToken,
    );
    const aId = (a.data!.saveQuest as Record<string, string>).id;
    const bId = (b.data!.saveQuest as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { quests(campaignId: $campaignId, search: $search) { id title } }`,
      { campaignId: CAMPAIGN_ID, search: uniqueMarker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const quests = res.data!.quests as Array<Record<string, string>>;
    const ids = quests.map((q) => q.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    // Description-only search should NOT find the quest
    const descRes = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { quests(campaignId: $campaignId, search: $search) { id } }`,
      { campaignId: CAMPAIGN_ID, search: 'ZZZ_only_in_desc' },
      gmToken,
    );
    const descQuests = descRes.data!.quests as Array<Record<string, string>>;
    expect(descQuests.find((q) => q.id === aId)).toBeUndefined();

    await prisma.quest.delete({ where: { id: aId } }).catch(() => {});
    await prisma.quest.delete({ where: { id: bId } }).catch(() => {});
  });

  it('filters quests by status (server-side, uppercase-normalized)', async () => {
    // Server accepts case-insensitive status and normalizes to UPPER for the
    // DB enum. Only quests matching the given status should be returned.
    const uniqueMarker = `StatQst${uid}`;
    const activeRes = await graphql(
      request,
      `mutation($campaignId: ID!, $input: QuestInput!) { saveQuest(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { title: `${uniqueMarker} Active`, status: 'ACTIVE' } },
      gmToken,
    );
    const compRes = await graphql(
      request,
      `mutation($campaignId: ID!, $input: QuestInput!) { saveQuest(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { title: `${uniqueMarker} Completed`, status: 'COMPLETED' } },
      gmToken,
    );
    const activeId = (activeRes.data!.saveQuest as Record<string, string>).id;
    const completedId = (compRes.data!.saveQuest as Record<string, string>).id;

    // Request with lowercase status — resolver should normalize
    const res = await graphql(
      request,
      `query($campaignId: ID!, $status: String) { quests(campaignId: $campaignId, status: $status) { id status } }`,
      { campaignId: CAMPAIGN_ID, status: 'active' },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const quests = res.data!.quests as Array<Record<string, string>>;
    expect(quests.find((q) => q.id === activeId)).toBeDefined();
    expect(quests.find((q) => q.id === completedId)).toBeUndefined();
    expect(quests.every((q) => q.status === 'ACTIVE')).toBe(true);

    await prisma.quest.delete({ where: { id: activeId } }).catch(() => {});
    await prisma.quest.delete({ where: { id: completedId } }).catch(() => {});
  });

  it('returns all quests for campaign when no search or status is provided', async () => {
    // Baseline: without filters, the resolver returns all quests scoped to
    // the campaign (existing behaviour must be preserved).
    const res = await graphql(
      request,
      `query($campaignId: ID!) { quests(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const quests = res.data!.quests as Array<Record<string, string>>;
    expect(Array.isArray(quests)).toBe(true);
  });

  it('deletes a quest', async () => {
    // Delete the quest and verify it no longer appears in the campaign's quest list.
    // This tests hard deletion (not soft-delete/archive).
    const res = await graphql(
      request,
      `mutation DeleteQuest($campaignId: ID!, $id: ID!) {
        deleteQuest(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: createdQuestId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    expect(res.data!.deleteQuest).toBe(true);

    // Verify gone from list
    const listRes = await graphql(
      request,
      `query Quests($campaignId: ID!) {
        quests(campaignId: $campaignId) { id }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    const quests = listRes.data!.quests as Array<Record<string, unknown>>;
    expect(quests.find((q) => q.id === createdQuestId)).toBeUndefined();
    createdQuestId = '';
  });
});
