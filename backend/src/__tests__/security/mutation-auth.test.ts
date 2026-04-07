/**
 * Mutation Authentication & Authorization Tests
 *
 * Audits every mutation for proper auth enforcement. Split into two sections:
 *
 * 1. "Mutations that enforce authentication" -- verifies that unauthenticated requests
 *    are rejected and that authorized roles (GM, Player) are accepted.
 *
 * 2. "Mutations now properly enforce GM authorization" -- verifies that
 *    GM-only mutations reject unauthenticated requests, reject Player role
 *    with FORBIDDEN, and still allow GM access.
 *
 * Uses nonexistent entity IDs for destructive mutations to avoid modifying seed data.
 *
 * Prerequisites: seeded campaign, GM user, and player user in database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Agent } from 'supertest';
import {
  getTestApp,
  loginAs,
  graphql,
  hasAuthError,
  hasErrorCode,
  GM_EMAIL,
  GM_PASSWORD,
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
  CAMPAIGN_ID,
} from '../helpers.js';

// ── Shared state ─────────────────────────────────────────────────────────────

let request: Agent;
let cleanup: () => Promise<void>;
let gmToken: string;
let playerToken: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  cleanup = app.cleanup;

  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
  playerToken = await loginAs(request, PLAYER_EMAIL, PLAYER_PASSWORD);
});

afterAll(async () => {
  await cleanup();
});

// ═══════════════════════════════════════════════════════════════════════════════
//  Mutations that CURRENTLY enforce auth (throw on missing user)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Mutations that enforce authentication', () => {
  describe('updateCampaign', () => {
    // updateCampaign requires authentication and GM role.
    const mutation = `
      mutation UpdateCampaign($id: ID!, $title: String) {
        updateCampaign(id: $id, title: $title) { id title }
      }
    `;
    const variables = { id: CAMPAIGN_ID, title: 'Farchester' };

    it('rejects unauthenticated requests', async () => {
      // No token provided -- should return an auth error.
      const res = await graphql(request, mutation, variables);
      expect(hasAuthError(res)).toBe(true);
    });

    it('allows GM', async () => {
      // GM token provided -- should succeed without auth error.
      const res = await graphql(request, mutation, variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.updateCampaign).toBeDefined();
    });
  });

  describe('saveCharacter (create)', () => {
    // saveCharacter now requires GM for ALL operations (create + update).
    // Per the GM-first design, only the GM creates characters and assigns
    // them to players; players cannot self-create characters.
    const mutation = `
      mutation SaveCharacter($campaignId: ID!, $name: String!) {
        saveCharacter(campaignId: $campaignId, name: $name) { id name }
      }
    `;
    const variables = { campaignId: CAMPAIGN_ID, name: '__test_character_auth__' };

    it('rejects unauthenticated requests', async () => {
      // No token -- should be rejected.
      const res = await graphql(request, mutation, variables);
      expect(hasAuthError(res)).toBe(true);
    });

    it('allows GM', async () => {
      // GM can create characters (and later assign to players).
      const res = await graphql(request, mutation, variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.saveCharacter).toBeDefined();
    });

    it('rejects Player role with FORBIDDEN', async () => {
      // Players cannot create characters; only the GM can.
      const res = await graphql(
        request,
        mutation,
        { ...variables, name: '__test_character_player_blocked__' },
        playerToken,
      );
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
    });
  });

  describe('saveCharacter (update)', () => {
    // saveCharacter with an existing ID requires GM role.
    const mutation = `
      mutation SaveCharacter($campaignId: ID!, $id: ID, $name: String!) {
        saveCharacter(campaignId: $campaignId, id: $id, name: $name) { id name }
      }
    `;
    const variables = { campaignId: CAMPAIGN_ID, id: 'char-alvin', name: 'Alvin Hart' };

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, mutation, variables);
      expect(hasAuthError(res)).toBe(true);
    });

    it('allows GM', async () => {
      const res = await graphql(request, mutation, variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
    });

    it('rejects Player role with FORBIDDEN', async () => {
      const res = await graphql(request, mutation, variables, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
    });
  });

  describe('saveSessionNote (both roles)', () => {
    // saveSessionNote requires authentication but allows both GM and Player,
    // since each user gets their own private note per session.
    const mutation = `
      mutation SaveSessionNote($sessionId: ID!, $content: String!) {
        saveSessionNote(sessionId: $sessionId, content: $content) { id content }
      }
    `;

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, mutation, { sessionId: 'ses-fc-1', content: 'test' });
      expect(hasAuthError(res)).toBe(true);
    });

    it('allows GM', async () => {
      const res = await graphql(request, mutation, { sessionId: 'ses-fc-1', content: '__test_note_gm__' }, gmToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.saveSessionNote).toBeDefined();
    });

    it('allows Player', async () => {
      const res = await graphql(request, mutation, { sessionId: 'ses-fc-1', content: '__test_note_player__' }, playerToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.saveSessionNote).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GM-only mutations — these previously had NO auth enforcement. After the
//  security hardening, each now requires a GM role on the target campaign.
//  Tests verify: unauthenticated requests are rejected, Player role is
//  rejected with FORBIDDEN, and GM access continues to work.
// ═══════════════════════════════════════════════════════════════════════════════

interface GmOnlyMutationTest {
  /** Human-readable name */
  name: string;
  /** GraphQL mutation string */
  mutation: string;
  /** Variables to send */
  variables: Record<string, unknown>;
}

/**
 * Generate a test suite verifying that a mutation properly enforces GM-only
 * authorization. Creates three tests:
 *   1. unauthenticated request is rejected (auth error)
 *   2. Player role is rejected with FORBIDDEN
 *   3. GM request does not produce an auth error (still works)
 */
function testGmOnly(opts: GmOnlyMutationTest) {
  describe(opts.name, () => {
    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, opts.mutation, opts.variables);
      expect(hasAuthError(res)).toBe(true);
    });

    it('rejects Player role with FORBIDDEN', async () => {
      const res = await graphql(request, opts.mutation, opts.variables, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
    });

    it('allows GM', async () => {
      const res = await graphql(request, opts.mutation, opts.variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
    });
  });
}

describe('Mutations now properly enforce GM authorization', () => {
  // ── NPC ────────────────────────────────────────────────────────────────

  testGmOnly({
    name: 'saveNPC (create)',
    mutation: `
      mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { name: '__test_npc_auth__' } },
  });

  testGmOnly({
    name: 'saveNPC (update)',
    mutation: `
      mutation SaveNPC($campaignId: ID!, $id: ID, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, id: $id, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'npc-kronheyv', input: { name: 'Lord-Admiral Edward Kronhev' } },
  });

  testGmOnly({
    name: 'deleteNPC',
    mutation: `
      mutation DeleteNPC($campaignId: ID!, $id: ID!) {
        deleteNPC(campaignId: $campaignId, id: $id)
      }
    `,
    // Uses nonexistent ID so GM-path doesn't destroy seed data. Auth/role
    // checks fire before the lookup, so this still exercises the
    // unauthenticated + Player rejection paths correctly.
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-npc-for-auth-test' },
  });

  // ── Location ──────────────────────────────────────────────────────────

  testGmOnly({
    name: 'saveLocation (create)',
    mutation: `
      mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { name: '__test_loc_auth__', type: 'tavern' } },
  });

  testGmOnly({
    name: 'saveLocation (update)',
    mutation: `
      mutation SaveLocation($campaignId: ID!, $id: ID, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, id: $id, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'loc-fc-farchester', input: { name: 'Farchester', type: 'city' } },
  });

  testGmOnly({
    name: 'deleteLocation',
    mutation: `
      mutation DeleteLocation($campaignId: ID!, $id: ID!) {
        deleteLocation(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-loc-for-auth-test' },
  });

  // ── Session ───────────────────────────────────────────────────────────

  testGmOnly({
    name: 'saveSession (create)',
    mutation: `
      mutation SaveSession($campaignId: ID!, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { number: 9999, title: '__test_session_auth__' } },
  });

  testGmOnly({
    name: 'saveSession (update)',
    mutation: `
      mutation SaveSession($campaignId: ID!, $id: ID, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, id: $id, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'ses-fc-1', input: { number: 1, title: 'Session 1 - 20.02.2026' } },
  });

  testGmOnly({
    name: 'deleteSession',
    mutation: `
      mutation DeleteSession($campaignId: ID!, $id: ID!) {
        deleteSession(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-session-for-auth-test' },
  });

  // ── Quest ─────────────────────────────────────────────────────────────

  testGmOnly({
    name: 'saveQuest (create)',
    mutation: `
      mutation SaveQuest($campaignId: ID!, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { title: '__test_quest_auth__' } },
  });

  testGmOnly({
    name: 'saveQuest (update)',
    mutation: `
      mutation SaveQuest($campaignId: ID!, $id: ID, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, id: $id, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'q-fc-1', input: { title: 'Find Special Alcohol for Lord-Admiral' } },
  });

  testGmOnly({
    name: 'deleteQuest',
    mutation: `
      mutation DeleteQuest($campaignId: ID!, $id: ID!) {
        deleteQuest(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-quest-for-auth-test' },
  });

  // ── Group ─────────────────────────────────────────────────────────────

  testGmOnly({
    name: 'saveGroup (create)',
    mutation: `
      mutation SaveGroup($campaignId: ID!, $input: GroupInput!) {
        saveGroup(campaignId: $campaignId, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { name: '__test_group_auth__' } },
  });

  testGmOnly({
    name: 'saveGroup (update)',
    mutation: `
      mutation SaveGroup($campaignId: ID!, $id: ID, $input: GroupInput!) {
        saveGroup(campaignId: $campaignId, id: $id, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'group-fc-party', input: { name: 'The Farchester Party' } },
  });

  testGmOnly({
    name: 'deleteGroup',
    mutation: `
      mutation DeleteGroup($campaignId: ID!, $id: ID!) {
        deleteGroup(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-group-for-auth-test' },
  });

  // ── Character ─────────────────────────────────────────────────────────

  testGmOnly({
    name: 'deleteCharacter',
    mutation: `
      mutation DeleteCharacter($campaignId: ID!, $id: ID!) {
        deleteCharacter(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-char-for-auth-test' },
  });

  // ── Relation ──────────────────────────────────────────────────────────

  testGmOnly({
    name: 'saveRelation (create)',
    mutation: `
      mutation SaveRelation($campaignId: ID!, $input: RelationInput!) {
        saveRelation(campaignId: $campaignId, input: $input) { id }
      }
    `,
    variables: {
      campaignId: CAMPAIGN_ID,
      input: {
        fromEntityType: 'npc',
        fromEntityId: 'npc-kronheyv',
        toEntityType: 'npc',
        toEntityId: 'npc-stoungriv',
        friendliness: 50,
      },
    },
  });

  // deleteRelation has a different shape: it looks up the relation by id
  // (findUniqueOrThrow) BEFORE calling requireGM, because it needs the
  // campaignId from the relation. Using a nonexistent id would throw
  // "not found" before auth runs, so we create a real relation via GM first
  // and then exercise the auth paths against it.
  describe('deleteRelation', () => {
    const mutation = `
      mutation DeleteRelation($id: ID!) {
        deleteRelation(id: $id)
      }
    `;
    const createMutation = `
      mutation SaveRelation($campaignId: ID!, $input: RelationInput!) {
        saveRelation(campaignId: $campaignId, input: $input) { id }
      }
    `;

    async function createRelation(): Promise<string> {
      const res = await graphql(
        request,
        createMutation,
        {
          campaignId: CAMPAIGN_ID,
          input: {
            fromEntityType: 'npc',
            fromEntityId: 'npc-kronheyv',
            toEntityType: 'npc',
            toEntityId: 'npc-stoungriv',
            friendliness: 50,
          },
        },
        gmToken,
      );
      const rel = res.data?.saveRelation as { id: string } | undefined;
      if (!rel) throw new Error(`Failed to create relation: ${JSON.stringify(res.errors)}`);
      return rel.id;
    }

    it('rejects unauthenticated requests', async () => {
      const id = await createRelation();
      const res = await graphql(request, mutation, { id });
      expect(hasAuthError(res)).toBe(true);
      // Clean up via GM
      await graphql(request, mutation, { id }, gmToken);
    });

    it('rejects Player role with FORBIDDEN', async () => {
      const id = await createRelation();
      const res = await graphql(request, mutation, { id }, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      // Clean up via GM
      await graphql(request, mutation, { id }, gmToken);
    });

    it('allows GM', async () => {
      const id = await createRelation();
      const res = await graphql(request, mutation, { id }, gmToken);
      expect(hasAuthError(res)).toBe(false);
    });
  });
});
