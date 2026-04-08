/**
 * Tests for useQuestListPage hook.
 *
 * Mocks the CAMPAIGN + QUESTS queries and asserts on:
 *  - derived shape (loading flags, filtered list, statusFilters)
 *  - search / statusFilter state transitions
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
  query Quests($campaignId: ID!) {
    quests(campaignId: $campaignId) {
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

const questsMock = {
  request: { query: QUESTS_QUERY, variables: { campaignId: 'camp-1' } },
  result: {
    data: {
      quests: [
        {
          ...baseQuest,
          id: 'q-1',
          title: 'Find the Sword',
          description: 'Locate the ancient blade',
          status: 'ACTIVE',
        },
        {
          ...baseQuest,
          id: 'q-2',
          title: 'Rescue the Merchant',
          description: 'The caravan was attacked',
          status: 'COMPLETED',
        },
        {
          ...baseQuest,
          id: 'q-3',
          title: 'Slay the Dragon',
          description: 'Dragon terrorises the villages',
          status: 'ACTIVE',
        },
      ],
    },
  },
};

describe('useQuestListPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsMock] },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.quests).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.questsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // statusFilters: all + 5 statuses
    expect(result.current.statusFilters).toHaveLength(6);
    expect(result.current.statusFilters[0]).toMatchObject({
      value: 'all',
      count: 3,
    });
    expect(
      result.current.statusFilters.find((f) => f.value === 'active')?.count,
    ).toBe(2);
    expect(
      result.current.statusFilters.find((f) => f.value === 'completed')?.count,
    ).toBe(1);
    expect(
      result.current.statusFilters.find((f) => f.value === 'failed')?.count,
    ).toBe(0);

    // Default (all, no search): all 3 quests
    expect(result.current.filtered).toHaveLength(3);
  });

  it('search filters by title and description', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('dragon'));
    await waitFor(() => expect(result.current.search).toBe('dragon'));
    expect(result.current.filtered.map((q) => q.id)).toEqual(['q-3']);

    act(() => result.current.setSearch('caravan'));
    await waitFor(() => expect(result.current.search).toBe('caravan'));
    // Matches description of q-2
    expect(result.current.filtered.map((q) => q.id)).toEqual(['q-2']);
  });

  it('statusFilter narrows results to a single status', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setStatusFilter('active'));
    await waitFor(() => expect(result.current.statusFilter).toBe('active'));
    expect(result.current.filtered.map((q) => q.id)).toEqual(['q-1', 'q-3']);

    act(() => result.current.setStatusFilter('all'));
    await waitFor(() => expect(result.current.statusFilter).toBe('all'));
    expect(result.current.filtered).toHaveLength(3);
  });

  it('openAdd / closeAdd toggles the drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useQuestListPage('camp-1'),
      { mocks: [campaignMock, questsMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addOpen).toBe(false);
    act(() => result.current.openAdd());
    expect(result.current.addOpen).toBe(true);
    act(() => result.current.closeAdd());
    expect(result.current.addOpen).toBe(false);
  });
});
