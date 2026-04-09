/**
 * Location Functional Tests
 *
 * Tests the complete location lifecycle: create, read, update, delete.
 * Also covers hierarchical location relationships (parent/child), location
 * type CRUD (create, assign to location, delete), and verifies that the
 * bidirectional parent-child GraphQL field resolvers work correctly.
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
let parentLocationId: string;
let childLocationId: string;
let locationTypeId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
});

afterAll(async () => {
  if (childLocationId) await prisma.location.delete({ where: { id: childLocationId } }).catch(() => {});
  if (parentLocationId) await prisma.location.delete({ where: { id: parentLocationId } }).catch(() => {});
  if (locationTypeId) await prisma.locationType.delete({ where: { id: locationTypeId } }).catch(() => {});
  await cleanup();
});

const LOC_FIELDS = `id campaignId name type description gmNotes parentLocationId playerVisible`;

describe('Locations', () => {
  it('creates a location with UUID', async () => {
    // Create a top-level location (no parent) via saveLocation mutation.
    // Verify: server generates a UUID string, campaignId matches, name is stored.
    const res = await graphql(
      request,
      `mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, input: $input) { ${LOC_FIELDS} }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: { name: `ParentLoc ${uid}`, description: 'A large city' },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const loc = res.data!.saveLocation as Record<string, unknown>;
    expect(loc.id).toBeDefined();
    expect(typeof loc.id).toBe('string');
    expect(loc.campaignId).toBe(CAMPAIGN_ID);
    expect(loc.name).toBe(`ParentLoc ${uid}`);
    parentLocationId = loc.id as string;
  });

  it('lists locations for campaign', async () => {
    // Query all locations for the campaign and verify the created location appears.
    const res = await graphql(
      request,
      `query Locations($campaignId: ID!) {
        locations(campaignId: $campaignId) { id name }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const locs = res.data!.locations as Array<Record<string, unknown>>;
    expect(locs.find((l) => l.id === parentLocationId)).toBeDefined();
  });

  it('updates location fields', async () => {
    // Update location name, description, and GM notes via saveLocation with an ID.
    // Verify: all three fields persist correctly through the upsert.
    const res = await graphql(
      request,
      `mutation SaveLocation($campaignId: ID!, $id: ID, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, id: $id, input: $input) { ${LOC_FIELDS} }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: parentLocationId,
        input: { name: `UpdatedLoc ${uid}`, description: 'Updated desc', gmNotes: 'Secret notes' },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const loc = res.data!.saveLocation as Record<string, unknown>;
    expect(loc.name).toBe(`UpdatedLoc ${uid}`);
    expect(loc.description).toBe('Updated desc');
    expect(loc.gmNotes).toBe('Secret notes');
  });

  it('creates a child location with parentLocationId', async () => {
    // Step 1: Create a child location linked to the parent via parentLocationId.
    // Verify: the child's parentLocation field resolver returns the parent's details.
    // Step 2: Query the parent and verify the child appears in the parent's children array.
    // This tests the bidirectional parent-child relationship in the GraphQL schema.
    const res = await graphql(
      request,
      `mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, input: $input) {
          id name parentLocationId
          parentLocation { id name }
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: { name: `ChildLoc ${uid}`, parentLocationId },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const loc = res.data!.saveLocation as Record<string, unknown>;
    expect(loc.parentLocationId).toBe(parentLocationId);
    const parent = loc.parentLocation as Record<string, unknown>;
    expect(parent.id).toBe(parentLocationId);
    childLocationId = loc.id as string;

    // Verify parent shows child
    const parentRes = await graphql(
      request,
      `query Location($campaignId: ID!, $id: ID!) {
        location(campaignId: $campaignId, id: $id) {
          id children { id name }
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: parentLocationId },
      gmToken,
    );
    const parentLoc = parentRes.data!.location as Record<string, unknown>;
    const children = parentLoc.children as Array<Record<string, unknown>>;
    expect(children.find((c) => c.id === childLocationId)).toBeDefined();
  });

  it('handles location type CRUD', async () => {
    // Tests the full location type lifecycle: create, assign to a location, unassign, and delete.
    // Location types are campaign-scoped categories (e.g., "castle", "tavern") with icons.

    // Step 1: Create a new location type
    const createRes = await graphql(
      request,
      `mutation SaveLocationType($campaignId: ID!, $name: String!, $icon: String!, $category: String!) {
        saveLocationType(campaignId: $campaignId, name: $name, icon: $icon, category: $category) {
          id name icon category
        }
      }`,
      { campaignId: CAMPAIGN_ID, name: `TestType ${uid}`, icon: 'castle', category: 'civilization' },
      gmToken,
    );

    expect(createRes.errors).toBeUndefined();
    const locType = createRes.data!.saveLocationType as Record<string, unknown>;
    expect(locType.name).toBe(`TestType ${uid}`);
    locationTypeId = locType.id as string;

    // Step 2: Assign the type to the parent location
    const assignRes = await graphql(
      request,
      `mutation SaveLocation($campaignId: ID!, $id: ID, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, id: $id, input: $input) { id type }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: parentLocationId,
        input: { name: `UpdatedLoc ${uid}`, type: locationTypeId },
      },
      gmToken,
    );
    expect(assignRes.errors).toBeUndefined();
    expect((assignRes.data!.saveLocation as Record<string, unknown>).type).toBe(locationTypeId);

    // Step 3: Clear the type from the location before deleting the type
    await graphql(
      request,
      `mutation SaveLocation($campaignId: ID!, $id: ID, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, id: $id, input: $input) { id type }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: parentLocationId,
        input: { name: `UpdatedLoc ${uid}`, type: '' },
      },
      gmToken,
    );

    // Step 4: Delete the location type itself
    const delRes = await graphql(
      request,
      `mutation DeleteLocationType($id: ID!) {
        deleteLocationType(id: $id)
      }`,
      { id: locationTypeId },
      gmToken,
    );
    expect(delRes.errors).toBeUndefined();
    expect(delRes.data!.deleteLocationType).toBe(true);
    locationTypeId = '';
  });

  it('filters locations by search (name, case-insensitive partial match)', async () => {
    // Server-side search by name. Case-insensitive substring match over
    // `name` only — description is NOT searched.
    const uniqueMarker = `SrchLoc${uid}`;
    const a = await graphql(
      request,
      `mutation($campaignId: ID!, $input: LocationInput!) { saveLocation(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Alpha`, description: 'ZZZ_only_in_desc' } },
      gmToken,
    );
    const b = await graphql(
      request,
      `mutation($campaignId: ID!, $input: LocationInput!) { saveLocation(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Beta` } },
      gmToken,
    );
    const aId = (a.data!.saveLocation as Record<string, string>).id;
    const bId = (b.data!.saveLocation as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { locations(campaignId: $campaignId, search: $search) { id name } }`,
      { campaignId: CAMPAIGN_ID, search: uniqueMarker.toLowerCase() },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const locs = res.data!.locations as Array<Record<string, string>>;
    const ids = locs.map((l) => l.id);
    expect(ids).toContain(aId);
    expect(ids).toContain(bId);

    // Description-only search should NOT find the location
    const descRes = await graphql(
      request,
      `query($campaignId: ID!, $search: String) { locations(campaignId: $campaignId, search: $search) { id } }`,
      { campaignId: CAMPAIGN_ID, search: 'ZZZ_only_in_desc' },
      gmToken,
    );
    const descLocs = descRes.data!.locations as Array<Record<string, string>>;
    expect(descLocs.find((l) => l.id === aId)).toBeUndefined();

    await prisma.location.delete({ where: { id: aId } }).catch(() => {});
    await prisma.location.delete({ where: { id: bId } }).catch(() => {});
  });

  it('filters locations by type (exact match on type id)', async () => {
    // Server-side type filter: exact match on the location's `type` column
    // (which stores the location type id string). Only locations with the
    // given type should be returned. We create a fresh LocationType for this
    // test since location.type is a FK to LocationType.id.
    const ltRes = await graphql(
      request,
      `mutation($campaignId: ID!, $name: String!, $icon: String!, $category: String!) {
        saveLocationType(campaignId: $campaignId, name: $name, icon: $icon, category: $category) { id }
      }`,
      { campaignId: CAMPAIGN_ID, name: `LtFilter ${uid}`, icon: 'place', category: 'civilization' },
      gmToken,
    );
    const ltId = (ltRes.data!.saveLocationType as Record<string, string>).id;

    const uniqueMarker = `TypeLoc${uid}`;
    const typed = await graphql(
      request,
      `mutation($campaignId: ID!, $input: LocationInput!) { saveLocation(campaignId: $campaignId, input: $input) { id type } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Typed`, type: ltId } },
      gmToken,
    );
    const untyped = await graphql(
      request,
      `mutation($campaignId: ID!, $input: LocationInput!) { saveLocation(campaignId: $campaignId, input: $input) { id } }`,
      { campaignId: CAMPAIGN_ID, input: { name: `${uniqueMarker} Untyped` } },
      gmToken,
    );
    const typedId = (typed.data!.saveLocation as Record<string, string>).id;
    const untypedId = (untyped.data!.saveLocation as Record<string, string>).id;

    const res = await graphql(
      request,
      `query($campaignId: ID!, $type: String) { locations(campaignId: $campaignId, type: $type) { id type } }`,
      { campaignId: CAMPAIGN_ID, type: ltId },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const locs = res.data!.locations as Array<Record<string, string>>;
    expect(locs.find((l) => l.id === typedId)).toBeDefined();
    expect(locs.find((l) => l.id === untypedId)).toBeUndefined();
    expect(locs.every((l) => l.type === ltId)).toBe(true);

    await prisma.location.delete({ where: { id: typedId } }).catch(() => {});
    await prisma.location.delete({ where: { id: untypedId } }).catch(() => {});
    await prisma.locationType.delete({ where: { id: ltId } }).catch(() => {});
  });

  it('returns all locations for campaign when no search or type is provided', async () => {
    // Baseline: without filters, the resolver returns all locations scoped
    // to the campaign (existing behaviour must be preserved).
    const res = await graphql(
      request,
      `query($campaignId: ID!) { locations(campaignId: $campaignId) { id } }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    expect(res.errors).toBeUndefined();
    const locs = res.data!.locations as Array<Record<string, string>>;
    expect(Array.isArray(locs)).toBe(true);
  });

  it('deletes a location', async () => {
    // Step 1: Delete the child location first (explicit ordering rather than relying on cascade).
    // Step 2: Delete the parent location and verify it returns true.
    // Step 3: Re-query the list to confirm the parent is gone (hard delete).
    const delChildRes = await graphql(
      request,
      `mutation DeleteLocation($campaignId: ID!, $id: ID!) {
        deleteLocation(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: childLocationId },
      gmToken,
    );
    expect(delChildRes.errors).toBeUndefined();
    childLocationId = '';

    const delRes = await graphql(
      request,
      `mutation DeleteLocation($campaignId: ID!, $id: ID!) {
        deleteLocation(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: parentLocationId },
      gmToken,
    );
    expect(delRes.errors).toBeUndefined();
    expect(delRes.data!.deleteLocation).toBe(true);

    // Verify gone
    const listRes = await graphql(
      request,
      `query Locations($campaignId: ID!) {
        locations(campaignId: $campaignId) { id }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );
    const locs = listRes.data!.locations as Array<Record<string, unknown>>;
    expect(locs.find((l) => l.id === parentLocationId)).toBeUndefined();
    parentLocationId = '';
  });
});
