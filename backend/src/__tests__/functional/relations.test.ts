/**
 * Relation (Social Graph) Functional Tests
 *
 * Tests the social graph relation system: create, update, query, and delete
 * directional relationships between entities (currently NPC-to-NPC).
 * Relations have a friendliness score (-100 to +100) and a note describing
 * the relationship. The relationsForEntity query returns all relations where
 * the entity appears on either side (from or to).
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
let npcAId: string;
let npcBId: string;
let relationId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);

  // Create two NPCs for relation tests
  const [resA, resB] = await Promise.all([
    graphql(
      request,
      `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { id }
      }`,
      { campaignId: CAMPAIGN_ID, input: { name: `RelNPC_A ${uid}` } },
      gmToken,
    ),
    graphql(
      request,
      `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { id }
      }`,
      { campaignId: CAMPAIGN_ID, input: { name: `RelNPC_B ${uid}` } },
      gmToken,
    ),
  ]);

  npcAId = (resA.data!.saveNPC as Record<string, string>).id;
  npcBId = (resB.data!.saveNPC as Record<string, string>).id;
});

afterAll(async () => {
  if (relationId) await prisma.relation.delete({ where: { id: relationId } }).catch(() => {});
  await prisma.nPC.delete({ where: { id: npcAId } }).catch(() => {});
  await prisma.nPC.delete({ where: { id: npcBId } }).catch(() => {});
  await cleanup();
});

describe('Relations', () => {
  it('creates a relation between two NPCs', async () => {
    // Create a directional relation from NPC A to NPC B with friendliness and a note.
    // Verify: server generates UUID, campaignId matches, friendliness/note persist,
    // and fromEntity/toEntity resolve with correct type and id.
    const res = await graphql(
      request,
      `mutation SaveRelation($campaignId: ID!, $input: RelationInput!) {
        saveRelation(campaignId: $campaignId, input: $input) {
          id campaignId friendliness note
          fromEntity { type id }
          toEntity { type id }
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: {
          fromEntityType: 'npc',
          fromEntityId: npcAId,
          toEntityType: 'npc',
          toEntityId: npcBId,
          friendliness: 40,
          note: 'Old friends',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const relation = res.data!.saveRelation as Record<string, unknown>;
    expect(relation.id).toBeDefined();
    expect(relation.campaignId).toBe(CAMPAIGN_ID);
    expect(relation.friendliness).toBe(40);
    expect(relation.note).toBe('Old friends');

    const from = relation.fromEntity as Record<string, unknown>;
    const to = relation.toEntity as Record<string, unknown>;
    expect(from.type).toBe('npc');
    expect(from.id).toBe(npcAId);
    expect(to.type).toBe('npc');
    expect(to.id).toBe(npcBId);

    relationId = relation.id as string;
  });

  it('updates a relation (friendliness and note)', async () => {
    // Update the relation's friendliness from positive (40) to negative (-40) and change the note.
    // Verify: both fields are updated, simulating a relationship deterioration in the story.
    const res = await graphql(
      request,
      `mutation SaveRelation($campaignId: ID!, $id: ID, $input: RelationInput!) {
        saveRelation(campaignId: $campaignId, id: $id, input: $input) {
          id friendliness note
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: relationId,
        input: {
          fromEntityType: 'npc',
          fromEntityId: npcAId,
          toEntityType: 'npc',
          toEntityId: npcBId,
          friendliness: -40,
          note: 'Now enemies',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const relation = res.data!.saveRelation as Record<string, unknown>;
    expect(relation.friendliness).toBe(-40);
    expect(relation.note).toBe('Now enemies');
  });

  it('queries relations for entity and returns correct relations', async () => {
    // Query relations involving NPC A using relationsForEntity.
    // Verify: the relation appears with the updated friendliness value.
    // Also query from NPC B's perspective to confirm the relation is bidirectionally queryable
    // (the query returns relations where the entity is on either side).
    const res = await graphql(
      request,
      `query RelationsForEntity($campaignId: ID!, $entityId: ID!) {
        relationsForEntity(campaignId: $campaignId, entityId: $entityId) {
          id friendliness note
          fromEntity { type id }
          toEntity { type id }
        }
      }`,
      { campaignId: CAMPAIGN_ID, entityId: npcAId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const relations = res.data!.relationsForEntity as Array<Record<string, unknown>>;
    const found = relations.find((r) => r.id === relationId);
    expect(found).toBeDefined();
    expect(found!.friendliness).toBe(-40);

    // Also query from the other side
    const resB = await graphql(
      request,
      `query RelationsForEntity($campaignId: ID!, $entityId: ID!) {
        relationsForEntity(campaignId: $campaignId, entityId: $entityId) { id }
      }`,
      { campaignId: CAMPAIGN_ID, entityId: npcBId },
      gmToken,
    );
    const relationsB = resB.data!.relationsForEntity as Array<Record<string, unknown>>;
    expect(relationsB.find((r) => r.id === relationId)).toBeDefined();
  });

  it('deletes a relation', async () => {
    // Delete the relation and verify it no longer appears in NPC A's relation list.
    const res = await graphql(
      request,
      `mutation DeleteRelation($id: ID!) {
        deleteRelation(id: $id)
      }`,
      { id: relationId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    expect(res.data!.deleteRelation).toBe(true);

    // Verify gone
    const queryRes = await graphql(
      request,
      `query RelationsForEntity($campaignId: ID!, $entityId: ID!) {
        relationsForEntity(campaignId: $campaignId, entityId: $entityId) { id }
      }`,
      { campaignId: CAMPAIGN_ID, entityId: npcAId },
      gmToken,
    );
    const relations = queryRes.data!.relationsForEntity as Array<Record<string, unknown>>;
    expect(relations.find((r) => r.id === relationId)).toBeUndefined();
    relationId = '';
  });
});
