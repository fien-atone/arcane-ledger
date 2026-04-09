/**
 * Tests for useLocationListPage hook.
 *
 * Mocks the three underlying GraphQL queries (CAMPAIGN + LOCATIONS +
 * LOCATION_TYPES) and asserts on:
 *  - the derived shape (loading flags, filtered list, typeFilters, depthMap)
 *  - search / typeFilter state transitions
 *  - hierarchical sort in "all" + no-search mode
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useLocationListPage } from './useLocationListPage';
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

const LOCATIONS_QUERY = gql`
  query Locations($campaignId: ID!, $search: String, $type: String) {
    locations(campaignId: $campaignId, search: $search, type: $type) {
      id campaignId name type settlementPopulation biome
      parentLocationId description image gmNotes
      playerVisible playerVisibleFields
      createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
    }
  }
`;

const LOCATION_TYPES_QUERY = gql`
  query LocationTypes($campaignId: ID!, $search: String) {
    locationTypes(campaignId: $campaignId, search: $search) {
      id name icon category biomeOptions isSettlement builtin
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
        enabledSections: ['LOCATIONS', 'LOCATION_TYPES', 'PARTY'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const locationsMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: {
    data: {
      locations: [
        {
          id: 'loc-1',
          campaignId: 'camp-1',
          name: 'World of Eldoria',
          type: 'lt-world',
          settlementPopulation: null,
          biome: null,
          parentLocationId: null,
          description: '',
          image: null,
          gmNotes: null,
          playerVisible: true,
          playerVisibleFields: [],
          createdAt: '2026-01-01',
          mapMarkers: [],
        },
        {
          id: 'loc-2',
          campaignId: 'camp-1',
          name: 'Kingdom of Arden',
          type: 'lt-region',
          settlementPopulation: null,
          biome: null,
          parentLocationId: 'loc-1',
          description: 'A peaceful land',
          image: null,
          gmNotes: null,
          playerVisible: true,
          playerVisibleFields: [],
          createdAt: '2026-01-02',
          mapMarkers: [],
        },
        {
          id: 'loc-3',
          campaignId: 'camp-1',
          name: 'Ardenhold',
          type: 'lt-settle',
          settlementPopulation: 10000,
          biome: null,
          parentLocationId: 'loc-2',
          description: 'Capital city',
          image: null,
          gmNotes: null,
          playerVisible: false,
          playerVisibleFields: [],
          createdAt: '2026-01-03',
          mapMarkers: [],
        },
      ],
    },
  },
};

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: {
    data: {
      locationTypes: [
        { id: 'lt-world',  name: 'Continent',  icon: 'public',    category: 'world',        biomeOptions: [], isSettlement: false, builtin: true },
        { id: 'lt-region', name: 'Region',     icon: 'terrain',   category: 'geographic',   biomeOptions: [], isSettlement: false, builtin: true },
        { id: 'lt-settle', name: 'Settlement', icon: 'apartment', category: 'civilization', biomeOptions: [], isSettlement: true,  builtin: true },
      ],
    },
  },
};

// F-11: the hook now relies on server-side search + type filter, so the
// second (refetch) mock used by the typeFilter test covers the filtered
// response.
const locationsRegionMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: 'lt-region' } },
  result: {
    data: {
      locations: (locationsMock.result.data.locations as Array<Record<string, unknown>>).filter(
        (l) => l.type === 'lt-region',
      ),
    },
  },
};

describe('useLocationListPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useLocationListPage('camp-1'),
      { mocks: [campaignMock, locationsMock, locationTypesMock] },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.locations).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.locationsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // typeFilters: "all" + 3 defined location types, no `count` field
    expect(result.current.typeFilters).toHaveLength(4);
    expect(result.current.typeFilters[0]).toEqual({ value: 'all', label: 'filter_all' });

    // depthMap: loc-1 (root) = 0, loc-2 = 1, loc-3 = 2
    expect(result.current.depthMap.get('loc-1')).toBe(0);
    expect(result.current.depthMap.get('loc-2')).toBe(1);
    expect(result.current.depthMap.get('loc-3')).toBe(2);

    // Default (all, no search) => hierarchical order: parent before children
    expect(result.current.filtered.map((l) => l.id)).toEqual([
      'loc-1',
      'loc-2',
      'loc-3',
    ]);
  });

  it('search is driven locally but updates the URL immediately', async () => {
    const { result } = renderHookWithProviders(
      () => useLocationListPage('camp-1'),
      { mocks: [campaignMock, locationsMock, locationTypesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('capital'));
    // `search` reflects the live input value immediately
    expect(result.current.search).toBe('capital');
    // The debounced query variable won't have fired yet — the list is unchanged.
    expect(result.current.locations).toHaveLength(3);
  });

  it('typeFilter triggers a server refetch with the type id', async () => {
    const { result } = renderHookWithProviders(
      () => useLocationListPage('camp-1'),
      { mocks: [campaignMock, locationsMock, locationTypesMock, locationsRegionMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setTypeFilter('lt-region'));
    await waitFor(() =>
      expect(result.current.locations!.map((l) => l.id)).toEqual(['loc-2']),
    );
    expect(result.current.typeFilter).toBe('lt-region');
  });

  it('openAdd/closeAdd toggles the drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useLocationListPage('camp-1'),
      { mocks: [campaignMock, locationsMock, locationTypesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addOpen).toBe(false);
    act(() => result.current.openAdd());
    expect(result.current.addOpen).toBe(true);
    act(() => result.current.closeAdd());
    expect(result.current.addOpen).toBe(false);
  });
});
