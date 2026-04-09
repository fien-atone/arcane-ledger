/**
 * Tests for useQuestListPage hook.
 *
 * F-11: search and status filtering are server-side. Tests mock the
 * underlying query with different variable combinations and assert on:
 *  - derived shape (loading flags, quests list, statusFilters without counts)
 *  - statusFilter transitions trigger a refetch with uppercase status
 *  - search updates the URL instantly but the query variable is debounced
 *  - openAdd / closeAdd drawer state
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useQuestListPage } from './useQuestListPage';
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

const QUESTS_QUERY = gql`
  query Quests($campaignId: ID!, $search: String, $status: String) {
    quests(campaignId: $campaignId, search: $search, status: $status) {
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
        enabledSections: ['QUESTS', 'PARTY'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const baseQuest = {
  campaignId: 'camp-1',
  giverId: null,
  reward: null,
  notes: '',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  giver: null,
  sessions: [],
};

const q1 = {
  ...baseQuest,
  id: 'q-1',
  title: 'Find the Sword',
  description: 'Locate the ancient blade',
  status: 'ACTIVE',
};
const q2 = {
  ...baseQuest,
  id: 'q-2',
  title: 'Rescue the Merchant',
  description: 'The caravan was attacked',
  status: 'COMPLETED',
};
const q3 = {
  ...baseQuest,
  id: 'q-3',
  title: 'Slay the Dragon',
  description: 'Dragon terrorises the villages',
  status: 'ACTIVE',
};

const questsUnfilteredMock = {
  request: { query: QUESTS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: { data: { quests: [q1, q2, q3] } },
};

const questsActiveMock = {
  request: { query: QUESTS_QUERY, variables: { campaignId: 'camp-1', search: null, status: 'ACTIVE' } },
  result: { data: { quests: [q1, q3] } },
};

describe('useQuestListPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsUnfilteredMock] },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quests).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.questsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // statusFilters: all + 5 statuses = 6 entries, no `count` field
    expect(result.current.statusFilters).toHaveLength(6);
    expect(result.current.statusFilters[0]).toEqual({
      value: 'all',
      label: 'filter_all',
    });
  });

  it('statusFilter triggers a server refetch with the uppercase status', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsUnfilteredMock, questsActiveMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.quests!.map((q) => q.id)).toEqual(['q-1', 'q-2', 'q-3']);

    act(() => result.current.setStatusFilter('active'));
    await waitFor(() =>
      expect(result.current.quests!.map((q) => q.id)).toEqual(['q-1', 'q-3']),
    );
    expect(result.current.statusFilter).toBe('active');
  });

  it('search is driven locally but updates the URL immediately', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsUnfilteredMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('dragon'));
    expect(result.current.search).toBe('dragon');
    // Debounced variable won't have fired yet — the list is unchanged.
    expect(result.current.quests).toHaveLength(3);
  });

  it('openAdd / closeAdd toggles the drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsUnfilteredMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addOpen).toBe(false);
    act(() => result.current.openAdd());
    expect(result.current.addOpen).toBe(true);
    act(() => result.current.closeAdd());
    expect(result.current.addOpen).toBe(false);
  });
});
