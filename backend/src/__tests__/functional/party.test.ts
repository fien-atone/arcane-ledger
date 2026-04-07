/**
 * Party & Character Functional Tests
 *
 * Tests player character CRUD (create, update, assign to player, delete) and
 * the campaign invitation flow (invite player, accept invitation, verify membership).
 * Characters start unassigned when created by the GM and can be assigned to players.
 * Invitations follow a PENDING -> ACCEPTED/DECLINED lifecycle and grant PLAYER role.
 *
 * Prerequisites: seeded campaign, GM user, player user (Ivan), and unaffiliated
 * user (Jess) in database.
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
let createdCharacterId: string;
let testCampaignId: string;
let invitationId: string;

// We need a fresh user for invitation tests — use user-jess who is not in Farchester
const JESS_EMAIL = 'jess@arcaneledger.app';
const JESS_PASSWORD = 'user';
const JESS_USER_ID = 'user-jess';

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  gmToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);

  // Create a separate campaign for invitation tests to avoid polluting seed data
  const campRes = await graphql(
    request,
    `mutation CreateCampaign($title: String!) {
      createCampaign(title: $title) { id }
    }`,
    { title: `PartyTestCampaign ${uid}` },
    gmToken,
  );
  testCampaignId = (campRes.data!.createCampaign as Record<string, string>).id;
});

afterAll(async () => {
  if (createdCharacterId) await prisma.playerCharacter.delete({ where: { id: createdCharacterId } }).catch(() => {});
  // Clean up invitation if still pending
  if (invitationId) await prisma.campaignInvitation.delete({ where: { id: invitationId } }).catch(() => {});
  // Remove Jess from test campaign if she was added
  await prisma.campaignMember.deleteMany({ where: { campaignId: testCampaignId, userId: JESS_USER_ID } }).catch(() => {});
  if (testCampaignId) await prisma.campaign.delete({ where: { id: testCampaignId } }).catch(() => {});
  await cleanup();
});

describe('Party & Characters', () => {
  it('creates a character with UUID', async () => {
    // Create a player character as GM with name, species, and class.
    // Verify: server generates UUID, campaignId matches, all fields persist,
    // and userId is null (GM-created characters are unassigned by default).
    const res = await graphql(
      request,
      `mutation SaveCharacter($campaignId: ID!, $name: String!, $species: String, $class: String) {
        saveCharacter(campaignId: $campaignId, name: $name, species: $species, class: $class) {
          id campaignId name species class userId
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        name: `TestChar ${uid}`,
        species: 'Human',
        class: 'Fighter',
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const character = res.data!.saveCharacter as Record<string, unknown>;
    expect(character.id).toBeDefined();
    expect(character.campaignId).toBe(CAMPAIGN_ID);
    expect(character.name).toBe(`TestChar ${uid}`);
    expect(character.species).toBe('Human');
    expect(character.class).toBe('Fighter');
    // GM creates unassigned character
    expect(character.userId).toBeNull();
    createdCharacterId = character.id as string;
  });

  it('updates character fields', async () => {
    // Update character name, appearance, and background via saveCharacter with an ID.
    // Verify: all fields persist correctly through the upsert.
    const res = await graphql(
      request,
      `mutation SaveCharacter($campaignId: ID!, $id: ID, $name: String!, $appearance: String, $background: String) {
        saveCharacter(campaignId: $campaignId, id: $id, name: $name, appearance: $appearance, background: $background) {
          id name appearance background
        }
      }`,
      {
        campaignId: CAMPAIGN_ID,
        id: createdCharacterId,
        name: `UpdatedChar ${uid}`,
        appearance: 'Tall and scarred',
        background: 'Ex-soldier',
      },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const character = res.data!.saveCharacter as Record<string, unknown>;
    expect(character.name).toBe(`UpdatedChar ${uid}`);
    expect(character.appearance).toBe('Tall and scarred');
    expect(character.background).toBe('Ex-soldier');
  });

  it('assigns character to a player', async () => {
    // Step 1: Assign the character to user-ivan (a PLAYER in Farchester).
    // Only the GM can assign characters to players.
    // Verify: userId is set to the player's ID.
    // Step 2: Unassign the character (set userId to null) for cleanup.
    const res = await graphql(
      request,
      `mutation AssignCharacter($characterId: ID!, $userId: ID) {
        assignCharacterToPlayer(characterId: $characterId, userId: $userId) {
          id userId
        }
      }`,
      { characterId: createdCharacterId, userId: 'user-ivan' },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const character = res.data!.assignCharacterToPlayer as Record<string, unknown>;
    expect(character.userId).toBe('user-ivan');

    // Unassign for cleanup
    await graphql(
      request,
      `mutation AssignCharacter($characterId: ID!, $userId: ID) {
        assignCharacterToPlayer(characterId: $characterId, userId: $userId) { id userId }
      }`,
      { characterId: createdCharacterId, userId: null },
      gmToken,
    );
  });

  it('deletes a character', async () => {
    // Delete the character as GM. Verify: mutation returns true.
    const res = await graphql(
      request,
      `mutation DeleteCharacter($campaignId: ID!, $id: ID!) {
        deleteCharacter(campaignId: $campaignId, id: $id)
      }`,
      { campaignId: CAMPAIGN_ID, id: createdCharacterId },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    expect(res.data!.deleteCharacter).toBe(true);
    createdCharacterId = '';
  });

  it('invites a player to a campaign', async () => {
    // GM invites Jess (who is not yet a member) to the test campaign.
    // Verify: invitation is created with PENDING status, correct campaignId,
    // and the user field resolves to Jess's user record.
    const res = await graphql(
      request,
      `mutation InvitePlayer($campaignId: ID!, $userId: ID!) {
        invitePlayer(campaignId: $campaignId, userId: $userId) {
          id campaignId status user { id }
        }
      }`,
      { campaignId: testCampaignId, userId: JESS_USER_ID },
      gmToken,
    );

    expect(res.errors).toBeUndefined();
    const invitation = res.data!.invitePlayer as Record<string, unknown>;
    expect(invitation.status).toBe('PENDING');
    expect(invitation.campaignId).toBe(testCampaignId);
    expect((invitation.user as Record<string, unknown>).id).toBe(JESS_USER_ID);
    invitationId = invitation.id as string;
  });

  it('accepts an invitation and user becomes campaign member', async () => {
    // Step 1: Jess accepts the invitation by calling respondToInvitation(accept: true).
    // Verify: invitation status changes to ACCEPTED and respondedAt is set.
    // Step 2: Query Jess's campaign list to confirm she now has PLAYER role
    // in the test campaign, proving the invitation flow creates a CampaignMember record.
    const jessToken = await loginAs(request, JESS_EMAIL, JESS_PASSWORD);

    const res = await graphql(
      request,
      `mutation RespondToInvitation($id: ID!, $accept: Boolean!) {
        respondToInvitation(id: $id, accept: $accept) {
          id status respondedAt
        }
      }`,
      { id: invitationId, accept: true },
      jessToken,
    );

    expect(res.errors).toBeUndefined();
    const invitation = res.data!.respondToInvitation as Record<string, unknown>;
    expect(invitation.status).toBe('ACCEPTED');
    expect(invitation.respondedAt).toBeTruthy();

    // Verify Jess is now a member
    const campaignsRes = await graphql(
      request,
      `query { campaigns { id myRole } }`,
      undefined,
      jessToken,
    );
    const campaigns = campaignsRes.data!.campaigns as Array<Record<string, unknown>>;
    const testCampaign = campaigns.find((c) => c.id === testCampaignId);
    expect(testCampaign).toBeDefined();
    expect(testCampaign!.myRole).toBe('PLAYER');

    invitationId = ''; // Already accepted, no need to clean up
  });
});
