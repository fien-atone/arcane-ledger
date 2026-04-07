/**
 * Tests for useQuestDetail hook.
 *
 * Mocks the two underlying GraphQL queries (CAMPAIGN_QUERY + QUEST_QUERY) and
 * asserts on the derived shape: role flag, section flags, campaign title.
 */
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useQuestDetail } from './useQuestDetail';
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

const QUEST_QUERY = gql`
  query Quest($campaignId: ID!, $id: ID!) {
    quest(campaignId: $campaignId, id: $id) {
      id
      campaignId
      title
      description
      giverId
      reward
      status
      notes
      playerVisible
      playerVisibleFields
      createdAt
      giver { id name species image }
      sessions { id number title datetime }
    }
  }
`;

const campaignMock = (myRole: string = 'GM') => ({
  request: { query: CAMPAIGN_QUERY, variables: { id: 'camp-1' } },
  result: {
    data: {
      campaign: {
        id: 'camp-1',
        title: 'Test Campaign',
        description: '',
        createdAt: '2026-01-01',
        archivedAt: null,
        myRole,
        enabledSections: ['QUESTS', 'NPCS', 'SESSIONS', 'PARTY'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
});

const questMock = {
  request: { query: QUEST_QUERY, variables: { campaignId: 'camp-1', id: 'q-1' } },
  result: {
    data: {
      quest: {
        id: 'q-1',
        campaignId: 'camp-1',
        title: 'Recover the Amulet',
        description: '<p>Go forth.</p>',
        giverId: null,
        reward: '',
        status: 'ACTIVE',
        notes: '',
        playerVisible: true,
        playerVisibleFields: [],
        createdAt: '2026-01-01',
        giver: null,
        sessions: [],
      },
    },
  },
};

describe('useQuestDetail', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useQuestDetail('camp-1', 'q-1'), {
      mocks: [campaignMock('GM'), questMock],
      initialRoute: '/campaigns/camp-1/quests/q-1',
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.quest).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quest).toBeDefined();
    expect(result.current.quest?.title).toBe('Recover the Amulet');
    expect(result.current.quest?.status).toBe('active');
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.isGm).toBe(true);

    // Section flags derived from enabledSections
    expect(result.current.questsEnabled).toBe(true);
    expect(result.current.npcsEnabled).toBe(true);
    expect(result.current.sessionsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);

    // Handlers are callable
    expect(typeof result.current.handleDelete).toBe('function');
    expect(typeof result.current.saveField).toBe('function');
    expect(typeof result.current.changeStatus).toBe('function');
  });

  it('derives isGm=false when campaign role is PLAYER', async () => {
    const { result } = renderHookWithProviders(() => useQuestDetail('camp-1', 'q-1'), {
      mocks: [campaignMock('PLAYER'), questMock],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isGm).toBe(false);
  });
});
