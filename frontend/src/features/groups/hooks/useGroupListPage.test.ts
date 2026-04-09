/**
 * Tests for useGroupListPage hook.
 *
 * Mocks the three underlying GraphQL queries (CAMPAIGN + GROUPS + GROUP_TYPES)
 * and asserts on:
 *  - the derived shape (loading flags, filtered list, typeFilters)
 *  - search / typeFilter state transitions
 *  - resolveType preferring the groupTypes catalog
 *  - openAdd / closeAdd drawer state
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useGroupListPage } from './useGroupListPage';
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

const GROUPS_QUERY = gql`
  query Groups($campaignId: ID!, $search: String, $type: String) {
    groups(campaignId: $campaignId, search: $search, type: $type) {
      id campaignId name type aliases description goals symbols
      gmNotes playerVisible playerVisibleFields
      createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

const GROUP_TYPES_QUERY = gql`
  query GroupTypes($campaignId: ID!, $search: String) {
    groupTypes(campaignId: $campaignId, search: $search) {
      id campaignId name icon description
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
        enabledSections: ['GROUPS', 'GROUP_TYPES', 'PARTY'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const baseGroup = {
  campaignId: 'camp-1',
  description: '',
  goals: null,
  symbols: null,
  gmNotes: null,
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  members: [],
};

const groupsMock = {
  request: {
    query: GROUPS_QUERY,
    variables: { campaignId: 'camp-1', search: null, type: null },
  },
  result: {
    data: {
      groups: [
        {
          ...baseGroup,
          id: 'g-1',
          name: 'Iron Order',
          type: 'gt-guild',
          aliases: ['The Order'],
        },
        {
          ...baseGroup,
          id: 'g-2',
          name: 'Ravens',
          type: 'gt-cult',
          aliases: [],
        },
        {
          ...baseGroup,
          id: 'g-3',
          name: 'Silver Coin',
          type: 'gt-guild',
          aliases: [],
        },
      ],
    },
  },
};

const groupTypesMock = {
  request: {
    query: GROUP_TYPES_QUERY,
    variables: { campaignId: 'camp-1', search: null },
  },
  result: {
    data: {
      groupTypes: [
        {
          id: 'gt-guild',
          campaignId: 'camp-1',
          name: 'Guild',
          icon: 'handshake',
          description: '',
        },
        {
          id: 'gt-cult',
          campaignId: 'camp-1',
          name: 'Cult',
          icon: 'local_fire_department',
          description: '',
        },
      ],
    },
  },
};

// F-11: second mock for the type-filter refetch
const groupsGuildMock = {
  request: {
    query: GROUPS_QUERY,
    variables: { campaignId: 'camp-1', search: null, type: 'gt-guild' },
  },
  result: {
    data: {
      groups: (groupsMock.result.data.groups as Array<Record<string, unknown>>).filter(
        (g) => g.type === 'gt-guild',
      ),
    },
  },
};

describe('useGroupListPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useGroupListPage('camp-1'),
      { mocks: [campaignMock, groupsMock, groupTypesMock] },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.groups).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.groupsEnabled).toBe(true);
    expect(result.current.groupTypesEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // typeFilters: all + 2 group types = 3 entries, no `count` field
    expect(result.current.typeFilters).toHaveLength(3);
    expect(result.current.typeFilters[0]).toEqual({
      value: 'all',
      label: 'filter_all',
    });

    // resolveType prefers the groupTypes catalog
    expect(result.current.resolveType('gt-guild')).toEqual({
      name: 'Guild',
      icon: 'handshake',
    });
    // Falls back to raw type id + default icon
    expect(result.current.resolveType('gt-unknown')).toEqual({
      name: 'gt-unknown',
      icon: 'category',
    });
  });

  it('search is driven locally but updates the URL immediately', async () => {
    const { result } = renderHookWithProviders(
      () => useGroupListPage('camp-1'),
      { mocks: [campaignMock, groupsMock, groupTypesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('silver'));
    expect(result.current.search).toBe('silver');
    // Debounced variable won't have fired yet — the list is unchanged.
    expect(result.current.groups).toHaveLength(3);
  });

  it('typeFilter triggers a server refetch with the type id', async () => {
    const { result } = renderHookWithProviders(
      () => useGroupListPage('camp-1'),
      { mocks: [campaignMock, groupsMock, groupTypesMock, groupsGuildMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setTypeFilter('gt-guild'));
    await waitFor(() =>
      expect(result.current.groups!.map((g) => g.id)).toEqual(['g-1', 'g-3']),
    );
    expect(result.current.typeFilter).toBe('gt-guild');
  });

  it('openAdd / closeAdd toggles the drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useGroupListPage('camp-1'),
      { mocks: [campaignMock, groupsMock, groupTypesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addOpen).toBe(false);
    act(() => result.current.openAdd());
    expect(result.current.addOpen).toBe(true);
    act(() => result.current.closeAdd());
    expect(result.current.addOpen).toBe(false);
  });
});
