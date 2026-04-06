/**
 * Session Functional Tests
 *
 * Tests the complete session lifecycle: create, read (list with ordering), update, delete.
 * Also covers linking sessions to NPCs/locations/quests (many-to-many via junction tables),
 * and per-user session notes (GM and player each get their own private note for the same session).
 *
 * Prerequisites: seeded campaign, GM user, and player user in database.
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
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
  CAMPAIGN_ID,
} from '../helpers.js';

let request: Agent;
let prisma: PrismaClient;
let cleanup: () => Promise<void>;
let gmToken: string;
let playerToken: string;

const uid = Date.now();
let createdSessionId: string;
let npcId: string;
let locationId: string;
let questId: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
  playerToken = await loginAs(request, PLAYER_EMAIL, PLAYER_PASSWORD);

  // Create helper entities for linking
  const npcRes = await graphql(
    request,
    `mutation SaveNPC($campaignId: ID!, $input: NPCInput!) {
      saveNPC(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `SessionTestNPC ${uid}` } },
    gmToken,
  );
  npcId = (npcRes.data!.saveNPC as Record<string, string>).id;

  const locRes = await graphql(
    request,
    `mutation SaveLocation($campaignId: ID!, $input: LocationInput!) {
      saveLocation(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { name: `SessionTestLoc ${uid}` } },
    gmToken,
  );
  locationId = (locRes.data!.saveLocation as Record<string, string>).id;

  const questRes = await graphql(
    request,
    `mutation SaveQuest($campaignId: ID!, $input: QuestInput!) {
      saveQuest(campaignId: $campaignId, input: $input) { id }
    }`,
    { campaignId: CAMPAIGN_ID, input: { title: `SessionTestQuest ${uid}` } },
    gmToken,
  );
  questId = (questRes.data!.saveQuest as Record<string, string>).id;
});

afterAll(async () => {
  if (createdSessionId) await prisma.session.delete({ where: { id: createdSessionId } }).catch(() => {});
  await prisma.nPC.delete({ where: { id: npcId } }).catch(() => {});
  await prisma.location.delete({ where: { id: locationId } }).catch(() => {});
  await prisma.quest.delete({ where: { id: questId } }).catch(() => {});
  await cleanup();
});

describe('Sessions', () => {
  it('creates a session with correct fields', async () => {
    // Create a new session with a unique number, title, datetime, and brief.
    // Verify: server generates UUID, all fields are persisted, campaignId matches.
    const sessionNumber = 9000 + Math.floor(Math.random() * 1000);
    const res = await graphql(
      request,
      `mutation SaveSession($campaignId: ID!, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, input: $input) {
          id campaignId number title datetime brief summary
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        input: {
          number: sessionNumber,
          title: `TestSession ${uid}`,
          datetime: '2026-04-01T19:00:00Z',
          brief: 'A test session brief',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const session = res.data!.saveSession as Record<string, unknown>;
    expect(session.id).toBeDefined();
    expect(session.campaignId).toBe(CAMPAIGN_ID);
    expect(session.number).toBe(sessionNumber);
    expect(session.title).toBe(`TestSession ${uid}`);
    expect(session.brief).toBe('A test session brief');
    createdSessionId = session.id as string;
  });

  it('lists sessions ordered by number (desc)', async () => {
    // Query all sessions for the campaign.
    // Verify: results are returned in descending order by session number,
    // so the most recent session appears first (matches the UI's display order).
    const res = await graphql(
      request,
      `query Sessions($campaignId: ID!) {
        sessions(campaignId: $campaignId) { id number title }
      }`,
      { campaignId: CAMPAIGN_ID },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const sessions = res.data!.sessions as Array<Record<string, unknown>>;
    expect(sessions.length).toBeGreaterThan(0);

    // Verify descending order
    for (let i = 1; i < sessions.length; i++) {
      expect((sessions[i - 1].number as number)).toBeGreaterThanOrEqual(sessions[i].number as number);
    }
  });

  it('updates session fields', async () => {
    // Update session title, brief, summary, and datetime via saveSession with an ID.
    // Verify: all updated fields persist correctly through the upsert.
    const res = await graphql(
      request,
      `mutation SaveSession($campaignId: ID!, $id: ID, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, id: $id, input: $input) {
          id title brief summary
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdSessionId,
        input: {
          number: 9000,
          title: `UpdatedSession ${uid}`,
          datetime: '2026-04-02T19:00:00Z',
          brief: 'Updated brief',
          summary: 'GM summary of events',
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const session = res.data!.saveSession as Record<string, unknown>;
    expect(session.title).toBe(`UpdatedSession ${uid}`);
    expect(session.brief).toBe('Updated brief');
    expect(session.summary).toBe('GM summary of events');
  });

  it('links NPCs, locations, and quests to session', async () => {
    // Attach NPC, location, and quest IDs to a session via saveSession.
    // These create junction table records (SessionNPC, SessionLocation, SessionQuest).
    // Verify: all three entities appear in the session's resolved relation arrays.
    const res = await graphql(
      request,
      `mutation SaveSession($campaignId: ID!, $id: ID, $input: SessionInput!) {
        saveSession(campaignId: $campaignId, id: $id, input: $input) {
          id npcs { id } locations { id } quests { id }
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdSessionId,
        input: {
          number: 9000,
          title: `UpdatedSession ${uid}`,
          npcIds: [npcId],
          locationIds: [locationId],
          questIds: [questId],
        },
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const session = res.data!.saveSession as Record<string, unknown>;
    const npcs = session.npcs as Array<Record<string, unknown>>;
    const locations = session.locations as Array<Record<string, unknown>>;
    const quests = session.quests as Array<Record<string, unknown>>;
    expect(npcs.some((n) => n.id === npcId)).toBe(true);
    expect(locations.some((l) => l.id === locationId)).toBe(true);
    expect(quests.some((q) => q.id === questId)).toBe(true);
  });

  it('saves session note as GM', async () => {
    // Save a personal note for this session as the GM user.
    // Session notes are per-user: each user gets exactly one note per session.
    // Verify: the note is created with the correct sessionId and content.
    const res = await graphql(
      request,
      `mutation SaveSessionNote($sessionId: ID!, $content: String!) {
        saveSessionNote(sessionId: $sessionId, content: $content) {
          id sessionId content
        }
      }`,
      { sessionId: createdSessionId, content: 'GM notes for session' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const note = res.data!.saveSessionNote as Record<string, unknown>;
    expect(note.sessionId).toBe(createdSessionId);
    expect(note.content).toBe('GM notes for session');
  });

  it('saves session note as player (separate from GM note)', async () => {
    // Save a personal note for the same session as the player user.
    // Verify: the player's note content is independent of the GM's note.
    // Also verify: querying the session as GM still returns the GM's own note,
    // confirming that the myNote field resolver scopes by authenticated user.
    const res = await graphql(
      request,
      `mutation SaveSessionNote($sessionId: ID!, $content: String!) {
        saveSessionNote(sessionId: $sessionId, content: $content) {
          id sessionId content
        }
      }`,
      { sessionId: createdSessionId, content: 'Player notes for session' },
      playerToken,
    );

    expect(res.errors).toBeUndefined();
    const note = res.data!.saveSessionNote as Record<string, unknown>;
    expect(note.content).toBe('Player notes for session');

    // Verify GM still sees their own note
    const gmSessionRes = await graphql(
      request,
      `query Session($campaignId: ID!, $id: ID!) {
        session(campaignId: $campaignId, id: $id) {
          myNote { content }
        }
      }`,
      { campaignId: CAMPAIGN_ID, id: createdSessionId },
      gmToken,
    );
    const gmNote = (gmSessionRes.data!.session as Record<string, unknown>).myNote as Record<string, unknown>;
    expect(gmNote.content).toBe('GM notes for session');
  });

  it('deletes a session', async () => {
    // Delete the session. Cascade should also remove linked junction records and notes.
    // Verify: mutation returns true.
    const res = await graphql(
      request,
      `mutation DeleteSession($campaignId: ID!, $id: ID!) {
        deleteSession(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: createdSessionId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    expect(res.data!.deleteSession).toBe(true);
    createdSessionId = '';
  });
});
