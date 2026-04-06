import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Agent } from 'supertest';
import {
  getTestApp,
  loginAs,
  graphql,
  hasAuthError,
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
    const mutation = `
      mutation UpdateCampaign($id: ID!, $title: String) {
        updateCampaign(id: $id, title: $title) { id title }
      }
    `;
    const variables = { id: CAMPAIGN_ID, title: 'Farchester' };

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, mutation, variables);
      expect(hasAuthError(res)).toBe(true);
    });

    it('allows GM', async () => {
      const res = await graphql(request, mutation, variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.updateCampaign).toBeDefined();
    });
  });

  describe('saveCharacter (create)', () => {
    const mutation = `
      mutation SaveCharacter($campaignId: ID!, $name: String!) {
        saveCharacter(campaignId: $campaignId, name: $name) { id name }
      }
    `;
    const variables = { campaignId: CAMPAIGN_ID, name: '__test_character_auth__' };

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, mutation, variables);
      expect(hasAuthError(res)).toBe(true);
    });

    it('allows GM', async () => {
      const res = await graphql(request, mutation, variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.saveCharacter).toBeDefined();
    });

    it('allows Player (creates own character)', async () => {
      const res = await graphql(request, mutation, { ...variables, name: '__test_character_player__' }, playerToken);
      expect(hasAuthError(res)).toBe(false);
      expect(res.data?.saveCharacter).toBeDefined();
    });
  });

  describe('saveCharacter (update)', () => {
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
  });

  describe('saveSessionNote (both roles)', () => {
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
//  SECURITY GAP: Mutations that currently have NO auth check.
//  These tests document the current (broken) behavior and will need to be
//  updated when auth enforcement is added to each mutation.
// ═══════════════════════════════════════════════════════════════════════════════

interface NoAuthMutationTest {
  /** Human-readable name */
  name: string;
  /** GraphQL mutation string */
  mutation: string;
  /** Variables to send */
  variables: Record<string, unknown>;
  /**
   * If true, the mutation is expected to succeed without auth.
   * If false, it will fail for a non-auth reason (e.g., entity not found).
   * Either way, it should NOT produce an auth error -- that's the gap.
   */
  expectsSuccess?: boolean;
}

/**
 * Document that a mutation currently DOES NOT require authentication.
 * When auth is added, change `hasAuthError` expectation to `true`.
 */
function testNoAuthGap(opts: NoAuthMutationTest) {
  describe(`[NO AUTH] ${opts.name}`, () => {
    it('currently allows unauthenticated requests (SECURITY GAP)', async () => {
      const res = await graphql(request, opts.mutation, opts.variables);
      // This documents the gap: no auth error is returned
      expect(hasAuthError(res)).toBe(false);
    });

    it('works with GM token', async () => {
      const res = await graphql(request, opts.mutation, opts.variables, gmToken);
      expect(hasAuthError(res)).toBe(false);
    });
  });
}

describe('Mutations WITHOUT auth enforcement (security gaps)', () => {
  // ── NPC ────────────────────────────────────────────────────────────────

  testNoAuthGap({
    name: 'saveNPC (create)',
    mutation: `
      mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { name: '__test_npc_noauth__' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'saveNPC (update)',
    mutation: `
      mutation SaveNPC($campaignId: ID!, $id: ID, $input: NPCInput!) {
        saveNPC(campaignId: $campaignId, id: $id, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'npc-kronheyv', input: { name: 'Lord-Admiral Edward Kronhev' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'deleteNPC',
    mutation: `
      mutation DeleteNPC($campaignId: ID!, $id: ID!) {
        deleteNPC(campaignId: $campaignId, id: $id)
      }
    `,
    // Uses nonexistent ID so we don't destroy seed data, but no auth error is returned
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-npc-for-auth-test' },
  });

  // ── Location ──────────────────────────────────────────────────────────

  testNoAuthGap({
    name: 'saveLocation (create)',
    mutation: `
      mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { name: '__test_loc_noauth__', type: 'tavern' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'saveLocation (update)',
    mutation: `
      mutation SaveLocation($campaignId: ID!, $id: ID, $input: LocationInput!) {
        saveLocation(campaignId: $campaignId, id: $id, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'loc-fc-farchester', input: { name: 'Farchester', type: 'city' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'deleteLocation',
    mutation: `
      mutation DeleteLocation($campaignId: ID!, $id: ID!) {
        deleteLocation(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-loc-for-auth-test' },
  });

  // ── Session ───────────────────────────────────────────────────────────

  testNoAuthGap({
    name: 'saveSession (create)',
    mutation: `
      mutation SaveSession($campaignId: ID!, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { number: 9999, title: '__test_session_noauth__' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'saveSession (update)',
    mutation: `
      mutation SaveSession($campaignId: ID!, $id: ID, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, id: $id, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'ses-fc-1', input: { number: 1, title: 'Session 1 - 20.02.2026' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'deleteSession',
    mutation: `
      mutation DeleteSession($campaignId: ID!, $id: ID!) {
        deleteSession(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-session-for-auth-test' },
  });

  // ── Quest ─────────────────────────────────────────────────────────────

  testNoAuthGap({
    name: 'saveQuest (create)',
    mutation: `
      mutation SaveQuest($campaignId: ID!, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { title: '__test_quest_noauth__' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'saveQuest (update)',
    mutation: `
      mutation SaveQuest($campaignId: ID!, $id: ID, $input: QuestInput!) {
        saveQuest(campaignId: $campaignId, id: $id, input: $input) { id title }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'q-fc-1', input: { title: 'Find Special Alcohol for Lord-Admiral' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'deleteQuest',
    mutation: `
      mutation DeleteQuest($campaignId: ID!, $id: ID!) {
        deleteQuest(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-quest-for-auth-test' },
  });

  // ── Group ─────────────────────────────────────────────────────────────

  testNoAuthGap({
    name: 'saveGroup (create)',
    mutation: `
      mutation SaveGroup($campaignId: ID!, $input: GroupInput!) {
        saveGroup(campaignId: $campaignId, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, input: { name: '__test_group_noauth__' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'saveGroup (update)',
    mutation: `
      mutation SaveGroup($campaignId: ID!, $id: ID, $input: GroupInput!) {
        saveGroup(campaignId: $campaignId, id: $id, input: $input) { id name }
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'group-fc-party', input: { name: 'The Farchester Party' } },
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'deleteGroup',
    mutation: `
      mutation DeleteGroup($campaignId: ID!, $id: ID!) {
        deleteGroup(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-group-for-auth-test' },
  });

  // ── Character (delete only — create/update DO check auth) ─────────────

  testNoAuthGap({
    name: 'deleteCharacter',
    mutation: `
      mutation DeleteCharacter($campaignId: ID!, $id: ID!) {
        deleteCharacter(campaignId: $campaignId, id: $id)
      }
    `,
    variables: { campaignId: CAMPAIGN_ID, id: 'nonexistent-char-for-auth-test' },
  });

  // ── Relation ──────────────────────────────────────────────────────────

  testNoAuthGap({
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
    expectsSuccess: true,
  });

  testNoAuthGap({
    name: 'deleteRelation',
    mutation: `
      mutation DeleteRelation($id: ID!) {
        deleteRelation(id: $id)
      }
    `,
    variables: { id: 'nonexistent-relation-for-auth-test' },
  });
});
