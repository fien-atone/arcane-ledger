/**
 * Campaign Functional Tests
 *
 * Tests the complete campaign lifecycle: create, read, update, archive/restore, and
 * section configuration. Verifies that the creating user is automatically assigned
 * the GM role, and that campaign metadata (title, description, enabledSections)
 * persists correctly through mutations.
 *
 * Prerequisites: seeded GM user in database.
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
const createdCampaignIds: string[] = [];

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
});

afterAll(async () => {
  // Clean up created campaigns
  for (const id of createdCampaignIds) {
    await prisma.campaign.delete({ where: { id } }).catch(() => {});
  }
  await cleanup();
});

describe('Campaigns', () => {
  it('creates a campaign and user becomes GM', async () => {
    // Create a new campaign and verify the creating user is auto-assigned the GM role.
    // Verify: server generates UUID, title and description are stored, myRole is GM.
    const title = `Test Campaign ${uid}`;
    const res = await graphql(
      request,
      `mutation CreateCampaign($title: String!, $description: String) {
        createCampaign(title: $title, description: $description) {
          id title description myRole
        }
      }`,
      { title, description: 'A test campaign' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const campaign = res.data!.createCampaign as Record<string, unknown>;
    expect(campaign.title).toBe(title);
    expect(campaign.description).toBe('A test campaign');
    expect(campaign.myRole).toBe('GM');
    expect(campaign.id).toBeDefined();
    createdCampaignIds.push(campaign.id as string);
  });

  it('lists campaigns with myRole', async () => {
    // Fetch all campaigns for the authenticated user.
    // Verify: the seeded Farchester campaign appears with myRole=GM,
    // confirming the resolver correctly resolves per-user role context.
    const res = await graphql(
      request,
      `query { campaigns { id title myRole } }`,
      undefined,
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const campaigns = res.data!.campaigns as Array<Record<string, unknown>>;
    expect(campaigns.length).toBeGreaterThan(0);

    // The seed campaign should be present
    const seeded = campaigns.find((c) => c.id === CAMPAIGN_ID);
    expect(seeded).toBeDefined();
    expect(seeded!.myRole).toBe('GM');
  });

  it('updates campaign title and description', async () => {
    // Update the campaign created in the first test.
    // Verify: both title and description fields are persisted and returned.
    const campaignId = createdCampaignIds[0];
    const newTitle = `Updated Campaign ${uid}`;
    const res = await graphql(
      request,
      `mutation UpdateCampaign($id: ID!, $title: String, $description: String) {
        updateCampaign(id: $id, title: $title, description: $description) {
          id title description
        }
      }`,
      { id: campaignId, title: newTitle, description: 'Updated description' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const campaign = res.data!.updateCampaign as Record<string, unknown>;
    expect(campaign.title).toBe(newTitle);
    expect(campaign.description).toBe('Updated description');
  });

  it('archives a campaign', async () => {
    // Archive the campaign by setting archivedAt to a timestamp.
    // Verify: archivedAt is truthy, meaning the campaign is soft-deleted.
    const campaignId = createdCampaignIds[0];
    const now = new Date().toISOString();
    const res = await graphql(
      request,
      `mutation UpdateCampaign($id: ID!, $archivedAt: String) {
        updateCampaign(id: $id, archivedAt: $archivedAt) {
          id archivedAt
        }
      }`,
      { id: campaignId, archivedAt: now },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const campaign = res.data!.updateCampaign as Record<string, unknown>;
    expect(campaign.archivedAt).toBeTruthy();
  });

  it('restores an archived campaign', async () => {
    // Restore the archived campaign by setting archivedAt to an empty string.
    // Verify: archivedAt becomes null, re-activating the campaign.
    const campaignId = createdCampaignIds[0];
    const res = await graphql(
      request,
      `mutation UpdateCampaign($id: ID!, $archivedAt: String) {
        updateCampaign(id: $id, archivedAt: $archivedAt) {
          id archivedAt
        }
      }`,
      { id: campaignId, archivedAt: '' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const campaign = res.data!.updateCampaign as Record<string, unknown>;
    expect(campaign.archivedAt).toBeNull();
  });

  it('updates campaign sections', async () => {
    // Configure which navigation sections are enabled for a campaign.
    // Verify: only the specified sections (SESSIONS, NPCS, QUESTS) are active,
    // and excluded sections (e.g., LOCATIONS) are not present.
    // Cleanup: restores all sections to avoid breaking other tests.
    const res = await graphql(
      request,
      `mutation UpdateSections($campaignId: ID!, $sections: [String!]!) {
        updateCampaignSections(campaignId: $campaignId, sections: $sections) {
          id enabledSections
        }
      }`,
      { campaignId: CAMPAIGN_ID, sections: ['SESSIONS', 'NPCS', 'QUESTS'] },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const campaign = res.data!.updateCampaignSections as Record<string, unknown>;
    const sections = campaign.enabledSections as string[];
    expect(sections).toContain('SESSIONS');
    expect(sections).toContain('NPCS');
    expect(sections).toContain('QUESTS');
    expect(sections).not.toContain('LOCATIONS');

    // Restore original sections
    await graphql(
      request,
      `mutation UpdateSections($campaignId: ID!, $sections: [String!]!) {
        updateCampaignSections(campaignId: $campaignId, sections: $sections) { id }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        sections: ['SESSIONS', 'NPCS', 'LOCATIONS', 'LOCATION_TYPES', 'GROUPS', 'GROUP_TYPES', 'QUESTS', 'PARTY', 'SOCIAL_GRAPH', 'SPECIES', 'SPECIES_TYPES'],
      },
      gmToken,
    );
  });
});
