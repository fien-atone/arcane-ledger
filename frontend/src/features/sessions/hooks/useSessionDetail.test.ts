/**
 * Tests for useSessionDetail — the page-level hook for SessionDetailPage.
 *
 * SessionDetailPage uses the list query (`useSessions`) and finds the
 * requested session by id, so the hook needs both the CAMPAIGN_QUERY mock
 * (for myRole + enabledSections) and the SESSIONS_QUERY mock.
 */
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useSessionDetail } from './useSessionDetail';
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

const SESSIONS_QUERY = gql`
  query Sessions($campaignId: ID!) {
    sessions(campaignId: $campaignId) {
      id
      campaignId
      number
      title
      datetime
      brief
      summary
      createdAt
      npcs { id name status species image playerVisible playerVisibleFields }
      locations { id name type playerVisible playerVisibleFields }
      quests { id title status playerVisible playerVisibleFields }
      myNote { id content updatedAt }
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
        enabledSections: ['SESSIONS', 'PARTY', 'LOCATION_TYPES'],
        sessionCount: 3,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const sessionFixture = (id: string, number: number, title: string) => ({
  id,
  campaignId: 'camp-1',
  number,
  title,
  datetime: '2026-01-01T20:00:00Z',
  brief: '',
  summary: '',
  createdAt: '2026-01-01',
  npcs: [],
  locations: [],
  quests: [],
  myNote: null,
});

const sessionsMock = {
  request: { query: SESSIONS_QUERY, variables: { campaignId: 'camp-1' } },
  result: {
    data: {
      sessions: [
        sessionFixture('s-1', 1, 'The Beginning'),
        sessionFixture('s-2', 2, 'The Escape'),
        sessionFixture('s-3', 3, 'The Confrontation'),
      ],
    },
  },
};

describe('useSessionDetail', () => {
  it('returns the requested session and its prev/next siblings', async () => {
    const { result } = renderHookWithProviders(() => useSessionDetail('camp-1', 's-2'), {
      mocks: [campaignMock, sessionsMock],
    });

    await waitFor(() => expect(result.current.session).toBeDefined());

    expect(result.current.session?.title).toBe('The Escape');
    // Sorted descending by number → idx of s-2 is 1, prev = idx+1 (s-1), next = idx-1 (s-3)
    expect(result.current.prevSession?.id).toBe('s-1');
    expect(result.current.nextSession?.id).toBe('s-3');
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.isGm).toBe(true);
    expect(result.current.sessionsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.locationTypesEnabled).toBe(true);
    expect(typeof result.current.saveField).toBe('function');
    expect(typeof result.current.saveNote).toBe('function');
    expect(typeof result.current.handleDelete).toBe('function');
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
    const { result } = renderHookWithProviders(() => useSessionDetail('camp-1', 's-2'), {
      mocks: [playerCampaignMock, sessionsMock],
    });

    await waitFor(() => expect(result.current.session).toBeDefined());
    expect(result.current.isGm).toBe(false);
  });
});
