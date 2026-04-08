/**
 * Tests for useCampaignsListPage — covers active/archived split with the
 * GM-first sort tiebreaker and the create-drawer open/close toggles.
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useCampaignsListPage } from './useCampaignsListPage';
import { renderHookWithProviders } from '@/test/helpers';

const CAMPAIGNS_QUERY = gql`
  query Campaigns {
    campaigns {
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

const CAMPAIGNS_CHANGED_SUBSCRIPTION = gql`
  subscription CampaignsChanged {
    campaignsChanged {
      entityType
      action
      campaignId
    }
  }
`;

const campaignsMock = {
  request: { query: CAMPAIGNS_QUERY },
  result: {
    data: {
      campaigns: [
        {
          id: 'c-player-b',
          title: 'Borderlands',
          description: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          myRole: 'PLAYER',
          enabledSections: ['SESSIONS'],
          sessionCount: 0,
          memberCount: 1,
          lastSession: null,
        },
        {
          id: 'c-gm-a',
          title: 'Ashes',
          description: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          myRole: 'GM',
          enabledSections: ['SESSIONS'],
          sessionCount: 0,
          memberCount: 1,
          lastSession: null,
        },
        {
          id: 'c-gm-z',
          title: 'Zephyr',
          description: null,
          createdAt: '2026-01-01',
          archivedAt: null,
          myRole: 'GM',
          enabledSections: ['SESSIONS'],
          sessionCount: 0,
          memberCount: 1,
          lastSession: null,
        },
        {
          id: 'c-archived',
          title: 'Old Saga',
          description: null,
          createdAt: '2025-01-01',
          archivedAt: '2026-02-01',
          myRole: 'GM',
          enabledSections: ['SESSIONS'],
          sessionCount: 0,
          memberCount: 1,
          lastSession: null,
        },
      ],
    },
  },
};

const subMock = {
  request: { query: CAMPAIGNS_CHANGED_SUBSCRIPTION },
  result: { data: { campaignsChanged: null } },
};

describe('useCampaignsListPage', () => {
  it('splits campaigns into active (GM-first, then title) and archived', async () => {
    const { result } = renderHookWithProviders(() => useCampaignsListPage(), {
      mocks: [campaignsMock, subMock],
    });
    await waitFor(() => expect(result.current.campaigns).toBeDefined());
    expect(result.current.active.map((c) => c.id)).toEqual([
      'c-gm-a',
      'c-gm-z',
      'c-player-b',
    ]);
    expect(result.current.archived.map((c) => c.id)).toEqual(['c-archived']);
  });

  it('openCreate and closeCreate toggle createOpen', async () => {
    const { result } = renderHookWithProviders(() => useCampaignsListPage(), {
      mocks: [campaignsMock, subMock],
    });
    await waitFor(() => expect(result.current.campaigns).toBeDefined());
    expect(result.current.createOpen).toBe(false);
    act(() => result.current.openCreate());
    expect(result.current.createOpen).toBe(true);
    act(() => result.current.closeCreate());
    expect(result.current.createOpen).toBe(false);
  });
});
