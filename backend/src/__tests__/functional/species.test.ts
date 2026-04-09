/**
 * Species Functional Tests
 *
 * Covers the server-side search + type filter for the species list query
 * added in F-11 (server-side search sweep). Matches the shape used by the
 * NPC pilot: unfiltered / search / filter + a baseline.
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

describe('Species', () => {
  it('filters species by search (name, case-insensitive partial match)', async () => {
    // Server-side search by name. Case-insensitive substring match over
    // `name` only.
    const uniqueMarker = `SrchSp${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $type: String!, $size: String!) {
        saveSpecies(campaignId: $campaignId, name: $name, type: $type, size: $size) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${uniqueMarker} Alpha`, type: 'humanoid', size: 'medium' },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $type: String!, $size: String!) {
        saveSpecies(campaignId: $campaignId, name: $name, type: $type, size: $size) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${uniqueMarker} Beta`, type: 'beast', size: 'small' },
      gmToken,
    );
    const aId = (a.data!.saveSpecies as Record<string, string>).id;
    const bId = (b.data!.saveSpecies as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { species(campaignId: $campaignId, search: $search) { id name } }`,
      { campaignId: CAMPAIGN_ID, search: uniqueMarker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const species = res.data!.species as Array<Record<string, string>>;
    const ids = species.map((s) => s.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    // Narrower search returns just one
    const narrow = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { species(campaignId: $campaignId, search: $search) { id name } }`,
      { campaignId: CAMPAIGN_ID, search: `${uniqueMarker} Alpha` },
      gmToken,
    );
    const narrowSpecies = narrow.data!.species as Array<Record<string, string>>;
    expect(narrowSpecies.map((s) => s.id)).toContain(aId);
    expect(narrowSpecies.map((s) => s.id)).not.toContain(bId);

    await prisma.species.delete({ where: { id: aId } }).catch(() => {});
    await prisma.species.delete({ where: { id: bId } }).catch(() => {});
  });

  it('filters species by type (exact match on type id)', async () => {
    // Server-side type filter: exact match on the species' `type` column.
    // Only species with the given type should be returned.
    const uniqueMarker = `TypeSp${uid}`;
    const humanoid = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $type: String!, $size: String!) {
        saveSpecies(campaignId: $campaignId, name: $name, type: $type, size: $size) { id type }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${uniqueMarker} Humanoid`, type: 'sp-filter-test', size: 'medium' },
      gmToken,
    );
    const beast = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $type: String!, $size: String!) {
        saveSpecies(campaignId: $campaignId, name: $name, type: $type, size: $size) { id type }
      }`,
      { campaignId: CAMPAIGN_ID, name: `${uniqueMarker} Beast`, type: 'beast', size: 'medium' },
      gmToken,
    );
    const humanoidId = (humanoid.data!.saveSpecies as Record<string, string>).id;
    const beastId = (beast.data!.saveSpecies as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $type: String) { species(campaignId: $campaignId, type: $type) { id type } }`,
      { campaignId: CAMPAIGN_ID, type: 'sp-filter-test' },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const species = res.data!.species as Array<Record<string, string>>;
    expect(species.find((s) => s.id === humanoidId)).toBeDefined();
    expect(species.find((s) => s.id === beastId)).toBeUndefined();
    expect(species.every((s) => s.type === 'sp-filter-test')).toBe(true);

    await prisma.species.delete({ where: { id: humanoidId } }).catch(() => {});
    await prisma.species.delete({ where: { id: beastId } }).catch(() => {});
  });

  it('returns all species for campaign when no search or type is provided', async () => {
    // Baseline: without filters, the resolver returns all species scoped to
    // the campaign (existing behaviour must be preserved).
    const res = await graphql(
      request,
      `query($campaignId: ID!) { species(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const species = res.data!.species as Array<Record<string, string>>;
    expect(Array.isArray(species)).toBe(true);
  });
});
