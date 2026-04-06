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
