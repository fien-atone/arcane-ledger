/**
 * Tests for useSpeciesListPage hook.
 *
 * Mocks the three underlying GraphQL queries (CAMPAIGN + SPECIES +
 * SPECIES_TYPES) and asserts on:
 *  - derived shape (loading flags, filtered list, typeFilters)
 *  - search / typeFilter state transitions
 *  - resolveTypeName preferring the speciesTypes catalog
 *  - openDrawer / closeDrawer state
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useSpeciesListPage } from './useSpeciesListPage';
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

const SPECIES_QUERY = gql`
  query Species($campaignId: ID!, $search: String, $type: String) {
    species(campaignId: $campaignId, search: $search, type: $type) {
      id campaignId name pluralName type size description traits
    }
  }
`;

const SPECIES_TYPES_QUERY = gql`
  query SpeciesTypes($campaignId: ID!, $search: String) {
    speciesTypes(campaignId: $campaignId, search: $search) {
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
        enabledSections: ['SPECIES', 'SPECIES_TYPES'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const speciesMock = {
  request: { query: SPECIES_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: {
    data: {
      species: [
        {
          id: 's-1',
          campaignId: 'camp-1',
          name: 'Elf',
          pluralName: 'Elves',
          type: 'st-humanoid',
          size: 'medium',
          description: '',
          traits: [],
        },
        {
          id: 's-2',
          campaignId: 'camp-1',
          name: 'Goblin',
          pluralName: 'Goblins',
          type: 'st-humanoid',
          size: 'small',
          description: '',
          traits: [],
        },
        {
          id: 's-3',
          campaignId: 'camp-1',
          name: 'Dragon',
          pluralName: 'Dragons',
          type: 'st-beast',
          size: 'huge',
          description: '',
          traits: [],
        },
      ],
    },
  },
};

const speciesTypesMock = {
  request: {
    query: SPECIES_TYPES_QUERY,
    variables: { campaignId: 'camp-1', search: null },
  },
  result: {
    data: {
      speciesTypes: [
        {
          id: 'st-humanoid',
          campaignId: 'camp-1',
          name: 'Humanoid',
          icon: 'person',
          description: '',
        },
        {
          id: 'st-beast',
          campaignId: 'camp-1',
          name: 'Beast',
          icon: 'pets',
          description: '',
        },
      ],
    },
  },
};

// F-11: second mock for the type-filter refetch
const speciesHumanoidMock = {
  request: { query: SPECIES_QUERY, variables: { campaignId: 'camp-1', search: null, type: 'st-humanoid' } },
  result: {
    data: {
      species: (speciesMock.result.data.species as Array<Record<string, unknown>>).filter(
        (s) => s.type === 'st-humanoid',
      ),
    },
  },
};

describe('useSpeciesListPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useSpeciesListPage('camp-1'),
      { mocks: [campaignMock, speciesMock, speciesTypesMock] },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.speciesList).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.speciesEnabled).toBe(true);
    expect(result.current.typesEnabled).toBe(true);

    // typeFilters: all + 2 species types = 3 entries (no count field)
    expect(result.current.typeFilters).toHaveLength(3);
    expect(result.current.typeFilters[0]).toEqual({ value: 'all', label: 'filter_all' });

    // resolveTypeName prefers the catalog, falls back to raw id
    expect(result.current.resolveTypeName('st-humanoid')).toBe('Humanoid');
    expect(result.current.resolveTypeName('st-unknown')).toBe('st-unknown');
  });

  it('search is driven locally but updates the URL immediately', async () => {
    const { result } = renderHookWithProviders(
      () => useSpeciesListPage('camp-1'),
      { mocks: [campaignMock, speciesMock, speciesTypesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('GOB'));
    expect(result.current.search).toBe('GOB');
    // Debounced variable won't have fired yet — list is unchanged.
    expect(result.current.speciesList).toHaveLength(3);
  });

  it('typeFilter triggers a server refetch with the type id', async () => {
    const { result } = renderHookWithProviders(
      () => useSpeciesListPage('camp-1'),
      { mocks: [campaignMock, speciesMock, speciesTypesMock, speciesHumanoidMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setTypeFilter('st-humanoid'));
    await waitFor(() =>
      expect(result.current.speciesList!.map((s) => s.id)).toEqual(['s-1', 's-2']),
    );
    expect(result.current.typeFilter).toBe('st-humanoid');
  });

  it('openDrawer / closeDrawer toggles the add drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useSpeciesListPage('camp-1'),
      { mocks: [campaignMock, speciesMock, speciesTypesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.drawerOpen).toBe(false);
    act(() => result.current.openDrawer());
    expect(result.current.drawerOpen).toBe(true);
    act(() => result.current.closeDrawer());
    expect(result.current.drawerOpen).toBe(false);
  });
});
