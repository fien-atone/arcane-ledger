/**
 * Group Functional Tests
 *
 * Tests the complete group (faction/organization) lifecycle: create, update, delete.
 * Also covers group type CRUD (create, update, delete) which provides reusable
 * categories for groups within a campaign (e.g., "Guild", "Military Order").
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
let createdGroupId: string;
let groupTypeId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
});

afterAll(async () => {
  if (createdGroupId) await prisma.group.delete({ where: { id: createdGroupId } }).catch(() => {});
  if (groupTypeId) await prisma.groupType.delete({ where: { id: groupTypeId } }).catch(() => {});
  await cleanup();
});

const GROUP_FIELDS = `id campaignId name type aliases description goals symbols gmNotes partyRelation`;

describe('Groups', () => {
  it('creates a group', async () => {
    // Create a new group (faction/organization) with name, description, and goals.
    // Verify: server generates UUID, campaignId matches, all fields persist.
    const res = await graphql(
      request,
      `mutation SaveGroup($campaignId: ID!, $input: GroupInput!) {
        saveGroup(campaignId: $campaignId, input: $input) { ${GROUP_FIELDS} }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: {
          name: `TestGroup ${uid}`,
          description: 'A secret guild',
          goals: 'World domination',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const group = res.data!.saveGroup as Record<string, unknown>;
    expect(group.id).toBeDefined();
    expect(group.campaignId).toBe(CAMPAIGN_ID);
    expect(group.name).toBe(`TestGroup ${uid}`);
    expect(group.description).toBe('A secret guild');
    expect(group.goals).toBe('World domination');
    createdGroupId = group.id as string;
  });

  it('updates group fields', async () => {
    // Update group name, description, symbols, and partyRelation via saveGroup with ID.
    // Verify: all fields update correctly, including the party relation text.
    const res = await graphql(
      request,
      `mutation SaveGroup($campaignId: ID!, $id: ID, $input: GroupInput!) {
        saveGroup(campaignId: $campaignId, id: $id, input: $input) { ${GROUP_FIELDS} }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdGroupId,
        input: {
          name: `UpdatedGroup ${uid}`,
          description: 'Updated guild description',
          symbols: 'A red dragon emblem',
          partyRelation: 'Allied',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const group = res.data!.saveGroup as Record<string, unknown>;
    expect(group.name).toBe(`UpdatedGroup ${uid}`);
    expect(group.symbols).toBe('A red dragon emblem');
    expect(group.partyRelation).toBe('Allied');
  });

  it('handles group type CRUD', async () => {
    // Tests the full group type lifecycle: create, update, and delete.
    // Group types are campaign-scoped categories (e.g., "Guild", "Government").

    // Step 1: Create a new group type with name, icon, and description
    const createRes = await graphql(
      request,
      `mutation SaveGroupType($campaignId: ID!, $name: String!, $icon: String, $description: String) {
        saveGroupType(campaignId: $campaignId, name: $name, icon: $icon, description: $description) {
          id name icon description
        }
      }`,
      { campaignId: CAMPAIGN_ID, name: `TestGroupType ${uid}`, icon: 'shield', description: 'A faction type' },
      gmToken,
    );

    expect(createRes.errors).toBeUndefined();
    const gt = createRes.data!.saveGroupType as Record<string, unknown>;
    expect(gt.name).toBe(`TestGroupType ${uid}`);
    groupTypeId = gt.id as string;

    // Step 2: Update the group type name and description
    const updateRes = await graphql(
      request,
      `mutation SaveGroupType($campaignId: ID!, $id: ID, $name: String!, $description: String) {
        saveGroupType(campaignId: $campaignId, id: $id, name: $name, description: $description) {
          id name description
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: groupTypeId, name: `UpdatedGroupType ${uid}`, description: 'Updated' },
      gmToken,
    );
    expect(updateRes.errors).toBeUndefined();
    expect((updateRes.data!.saveGroupType as Record<string, unknown>).name).toBe(`UpdatedGroupType ${uid}`);

    // Step 3: Delete the group type
    const delRes = await graphql(
      request,
      `mutation DeleteGroupType($id: ID!) { deleteGroupType(id: $id) }`,
      { id: groupTypeId },
      gmToken,
    );
    expect(delRes.errors).toBeUndefined();
    expect(delRes.data!.deleteGroupType).toBe(true);
    groupTypeId = '';
  });

  it('deletes a group', async () => {
    // Delete the group and verify it no longer appears in the campaign's group list.
    const res = await graphql(
      request,
      `mutation DeleteGroup($campaignId: ID!, $id: ID!) {
        deleteGroup(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: createdGroupId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    expect(res.data!.deleteGroup).toBe(true);

    // Verify gone
    const listRes = await graphql(
      request,
      `query Groups($campaignId: ID!) {
        groups(campaignId: $campaignId) { id }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    const groups = listRes.data!.groups as Array<Record<string, unknown>>;
    expect(groups.find((g) => g.id === createdGroupId)).toBeUndefined();
    createdGroupId = '';
  });
});
