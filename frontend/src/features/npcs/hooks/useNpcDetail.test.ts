/**
 * Reference test for a page-level hook.
 *
 * useNpcDetail composes 9 Apollo queries under the hood (NPC + campaign +
 * 7 section-enabled checks). We mock the two underlying GraphQL queries
 * (CAMPAIGN_QUERY and NPC_QUERY) — Apollo dedupes the repeated campaign
 * query internally, so the test only needs one CAMPAIGN_QUERY mock.
 */
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useNpcDetail } from './useNpcDetail';
import { renderHookWithProviders } from '@/test/helpers';

const CAMPAIGN_QUERY = gql`
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id
      title
      description
      createdAt
      archivedAt
      myRole
      enabledSections
      sessionCount
      memberCount
      lastSession {
        title
        datetime
      }
    }
  }
`;

const NPC_QUERY = gql`
  query Npc($campaignId: ID!, $id: ID!) {
    npc(campaignId: $campaignId, id: $id) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const campaignMock = {
  request: { query: CAMPAIGN_QUERY, variables: { id: 'camp-1' } },
  result: {
    data: {
      campaign: {
        id: 'camp-1',
        title: 'Test Campaign',
        description: '',
        createdAt: '2026-01-01',
        archivedAt: null,
        myRole: 'GM',
        enabledSections: ['NPCS', 'PARTY', 'SESSIONS', 'LOCATIONS', 'QUESTS', 'GROUPS'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const npcMock = {
  request: { query: NPC_QUERY, variables: { campaignId: 'camp-1', id: 'npc-1' } },
  result: {
    data: {
      npc: {
        id: 'npc-1',
        campaignId: 'camp-1',
        name: 'Alvin',
        aliases: [],
        status: 'ALIVE',
        gender: null,
        age: null,
        species: null,
        speciesId: null,
        appearance: null,
        personality: null,
        description: '',
        motivation: null,
        flaws: null,
        gmNotes: null,
        image: null,
        playerVisible: true,
        playerVisibleFields: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        locationPresences: [],
        groupMemberships: [],
      },
    },
  },
};

describe('useNpcDetail', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useNpcDetail('camp-1', 'npc-1'), {
      mocks: [campaignMock, npcMock],
      initialRoute: '/campaigns/camp-1/npcs/npc-1',
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.npc).toBeUndefined();

    // Wait for queries to resolve
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // NPC data loaded, enum normalised to lowercase
    expect(result.current.npc).toBeDefined();
    expect(result.current.npc?.name).toBe('Alvin');
    expect(result.current.npc?.status).toBe('alive');

    // Campaign metadata derived
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.isGm).toBe(true);

    // Section flags correctly derived from enabledSections
    expect(result.current.npcsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.sessionsEnabled).toBe(true);
    expect(result.current.speciesEnabled).toBe(false); // not in enabledSections

    // Handlers are callable (typed as functions)
    expect(typeof result.current.handleDelete).toBe('function');
    expect(typeof result.current.saveField).toBe('function');
    expect(typeof result.current.handleImageUpload).toBe('function');
  });

  it('derives isGm=false when campaign role is PLAYER', async () => {
    const playerCampaignMock = {
      ...campaignMock,
      result: {
        data: {
          campaign: { ...campaignMock.result.data.campaign, myRole: 'PLAYER' },
        },
      },
    };
    const { result } = renderHookWithProviders(() => useNpcDetail('camp-1', 'npc-1'), {
      mocks: [playerCampaignMock, npcMock],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isGm).toBe(false);
  });
});
