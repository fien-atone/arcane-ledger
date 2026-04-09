/**
 * Reference Type List Search Tests (F-11 sweep)
 *
 * Covers the server-side name search for the three campaign-scoped
 * reference-data list queries: groupTypes, locationTypes, speciesTypes.
 *
 * Matches the shape used by NPC/Species pilots: baseline (unfiltered),
 * partial-match search, and narrower-match search.
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

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
});

afterAll(async () => {
  await cleanup();
});

describe('GroupTypes', () => {
  it('filters groupTypes by search (name, case-insensitive partial match)', async () => {
    const marker = `SrchGt${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!) {
        saveGroupType(campaignId: $campaignId, name: $name) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${marker} Alpha` },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!) {
        saveGroupType(campaignId: $campaignId, name: $name) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${marker} Beta` },
      gmToken,
    );
    const aId = (a.data!.saveGroupType as Record<string, string>).id;
    const bId = (b.data!.saveGroupType as Record<string, string>).id;

    // Partial case-insensitive search returns both
    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) {
        groupTypes(campaignId: $campaignId, search: $search) { id name }
      }`,
      { campaignId: CAMPAIGN_ID, search: marker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const ids = (res.data!.groupTypes as Array<Record<string, string>>).map((g) => g.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    // Narrower search returns just one
    const narrow = await graphql(
      request,
      `query($campaignId: ID!, $search: String) {
        groupTypes(campaignId: $campaignId, search: $search) { id }
      }`,
      { campaignId: CAMPAIGN_ID, search: `${marker} Alpha` },
      gmToken,
    );
    const narrowIds = (narrow.data!.groupTypes as Array<Record<string, string>>).map((g) => g.id);
    expect(narrowIds).toContain(aId);
    expect(narrowIds).not.toContain(bId);

    await prisma.groupType.delete({ where: { id: aId } }).catch(() => {});
    await prisma.groupType.delete({ where: { id: bId } }).catch(() => {});
  });

  it('returns all groupTypes for campaign when no search provided', async () => {
    const res = await graphql(
      request,
      `query($campaignId: ID!) { groupTypes(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const list = res.data!.groupTypes as Array<Record<string, string>>;
    expect(Array.isArray(list)).toBe(true);
  });
});

describe('LocationTypes', () => {
  it('filters locationTypes by search (name, case-insensitive partial match)', async () => {
    const marker = `SrchLt${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $icon: String!, $category: String!) {
        saveLocationType(campaignId: $campaignId, name: $name, icon: $icon, category: $category) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${marker} Alpha`, icon: 'public', category: 'geographic' },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $icon: String!, $category: String!) {
        saveLocationType(campaignId: $campaignId, name: $name, icon: $icon, category: $category) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${marker} Beta`, icon: 'public', category: 'geographic' },
      gmToken,
    );
    const aId = (a.data!.saveLocationType as Record<string, string>).id;
    const bId = (b.data!.saveLocationType as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) {
        locationTypes(campaignId: $campaignId, search: $search) { id name }
      }`,
      { campaignId: CAMPAIGN_ID, search: marker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const ids = (res.data!.locationTypes as Array<Record<string, string>>).map((t) => t.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    const narrow = await graphql(
      request,
      `query($campaignId: ID!, $search: String) {
        locationTypes(campaignId: $campaignId, search: $search) { id }
      }`,
      { campaignId: CAMPAIGN_ID, search: `${marker} Alpha` },
      gmToken,
    );
    const narrowIds = (narrow.data!.locationTypes as Array<Record<string, string>>).map((t) => t.id);
    expect(narrowIds).toContain(aId);
    expect(narrowIds).not.toContain(bId);

    await prisma.locationType.delete({ where: { id: aId } }).catch(() => {});
    await prisma.locationType.delete({ where: { id: bId } }).catch(() => {});
  });

  it('returns all locationTypes for campaign when no search provided', async () => {
    const res = await graphql(
      request,
      `query($campaignId: ID!) { locationTypes(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const list = res.data!.locationTypes as Array<Record<string, string>>;
    expect(Array.isArray(list)).toBe(true);
    // Should include the seeded builtins
    expect(list.length).toBeGreaterThan(0);
  });
});

describe('SpeciesTypes', () => {
  it('filters speciesTypes by search (name, case-insensitive partial match)', async () => {
    const marker = `SrchSt${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!) {
        saveSpeciesType(campaignId: $campaignId, name: $name) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${marker} Alpha` },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!) {
        saveSpeciesType(campaignId: $campaignId, name: $name) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${marker} Beta` },
      gmToken,
    );
    const aId = (a.data!.saveSpeciesType as Record<string, string>).id;
    const bId = (b.data!.saveSpeciesType as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) {
        speciesTypes(campaignId: $campaignId, search: $search) { id name }
      }`,
      { campaignId: CAMPAIGN_ID, search: marker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const ids = (res.data!.speciesTypes as Array<Record<string, string>>).map((s) => s.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    const narrow = await graphql(
      request,
      `query($campaignId: ID!, $search: String) {
        speciesTypes(campaignId: $campaignId, search: $search) { id }
      }`,
      { campaignId: CAMPAIGN_ID, search: `${marker} Alpha` },
      gmToken,
    );
    const narrowIds = (narrow.data!.speciesTypes as Array<Record<string, string>>).map((s) => s.id);
    expect(narrowIds).toContain(aId);
    expect(narrowIds).not.toContain(bId);

    await prisma.speciesType.delete({ where: { id: aId } }).catch(() => {});
    await prisma.speciesType.delete({ where: { id: bId } }).catch(() => {});
  });

  it('returns all speciesTypes for campaign when no search provided', async () => {
    const res = await graphql(
      request,
      `query($campaignId: ID!) { speciesTypes(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const list = res.data!.speciesTypes as Array<Record<string, string>>;
    expect(Array.isArray(list)).toBe(true);
  });
});
