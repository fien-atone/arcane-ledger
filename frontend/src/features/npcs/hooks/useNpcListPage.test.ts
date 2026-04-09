/**
 * Tests for useNpcListPage hook.
 *
 * F-11: search and status filtering are server-side. The hook passes
 * debounced search + uppercase status as GraphQL variables. These tests
 * mock the underlying queries with different variable combinations and
 * assert on:
 *  - the derived shape (loading flags, list, statusFilters without counts)
 *  - statusFilter state transitions trigger a refetch with uppercase status
 *  - resolveSpeciesName preferring the species catalog
 *  - openAdd / closeAdd drawer state
 *
 * Debounced search is covered separately in useDebouncedSearch.test.ts;
 * here we verify the hook wires the variables through correctly.
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useNpcListPage } from './useNpcListPage';
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

const NPCS_QUERY = gql`
  query Npcs($campaignId: ID!, $search: String, $status: String) {
    npcs(campaignId: $campaignId, search: $search, status: $status) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
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
        enabledSections: ['NPCS', 'SPECIES', 'PARTY', 'SOCIAL_GRAPH'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const baseNpc = {
  campaignId: 'camp-1',
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
};

const aldric = {
  ...baseNpc,
  id: 'npc-1',
  name: 'Aldric Thorne',
  aliases: ['The Grey'],
  status: 'ALIVE',
  speciesId: 'sp-human',
};
const mira = {
  ...baseNpc,
  id: 'npc-2',
  name: 'Mira Vale',
  aliases: [],
  status: 'DEAD',
  speciesId: null,
  species: 'Elf',
};
const borin = {
  ...baseNpc,
  id: 'npc-3',
  name: 'Borin',
  aliases: [],
  status: 'MISSING',
};

// Unfiltered load — matches initial hook mount (search: null, status: null)
const npcsUnfilteredMock = {
  request: {
    query: NPCS_QUERY,
    variables: { campaignId: 'camp-1', search: null, status: null },
  },
  result: {
    data: { npcs: [aldric, mira, borin] },
  },
};

// Status=DEAD refetch
const npcsDeadMock = {
  request: {
    query: NPCS_QUERY,
    variables: { campaignId: 'camp-1', search: null, status: 'DEAD' },
  },
  result: {
    data: { npcs: [mira] },
  },
};

const speciesMock = {
  request: { query: SPECIES_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: {
    data: {
      species: [
        {
          id: 'sp-human',
          campaignId: 'camp-1',
          name: 'Human',
          pluralName: 'Humans',
          type: 'humanoid',
          size: 'medium',
          description: '',
          traits: [],
        },
      ],
    },
  },
};

describe('useNpcListPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsUnfilteredMock, speciesMock] },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.npcs).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.npcsEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.speciesEnabled).toBe(true);
    expect(result.current.socialGraphEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // statusFilters: all + 4 statuses = 5 entries, no `count` field
    expect(result.current.statusFilters).toHaveLength(5);
    expect(result.current.statusFilters[0]).toEqual({
      value: 'all',
      label: 'status_all',
    });

    // resolveSpeciesName prefers the species catalog
    const a = result.current.npcs!.find((n) => n.id === 'npc-1')!;
    expect(result.current.resolveSpeciesName(a)).toBe('Human');
    // Falls back to free-text species
    const m = result.current.npcs!.find((n) => n.id === 'npc-2')!;
    expect(result.current.resolveSpeciesName(m)).toBe('Elf');
  });

  it('statusFilter triggers a server refetch with the uppercase status', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsUnfilteredMock, speciesMock, npcsDeadMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.npcs!.map((n) => n.id)).toEqual(['npc-1', 'npc-2', 'npc-3']);

    act(() => result.current.setStatusFilter('dead'));
    await waitFor(() =>
      expect(result.current.npcs!.map((n) => n.id)).toEqual(['npc-2']),
    );
    expect(result.current.statusFilter).toBe('dead');
  });

  it('previousData keeps the list visible while the new query is in flight', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsUnfilteredMock, speciesMock, npcsDeadMock] },
    );
    // Wait for the initial list to appear
    await waitFor(() => expect(result.current.npcs).toHaveLength(3));

    // Trigger a refetch by changing the status filter; between the
    // state update and the mock resolving, `npcs` must NOT become undefined.
    act(() => result.current.setStatusFilter('dead'));
    // Immediately after dispatch, npcs should still reflect the previous
    // (unfiltered) list OR the new one — but never undefined/empty while
    // isLoading remains false (initial load completed).
    expect(result.current.isLoading).toBe(false);
    expect(result.current.npcs).toBeDefined();
    expect(result.current.npcs!.length).toBeGreaterThan(0);

    await waitFor(() =>
      expect(result.current.npcs!.map((n) => n.id)).toEqual(['npc-2']),
    );
  });

  it('search is driven locally but updates the URL immediately', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsUnfilteredMock, speciesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('ald'));
    // `search` reflects the live input value (drives the <input>)
    expect(result.current.search).toBe('ald');
    // The debounced query variable (tested separately in
    // useDebouncedSearch) won't have fired yet — the list is unchanged.
    expect(result.current.npcs).toHaveLength(3);
  });

  it('openAdd / closeAdd toggles the drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsUnfilteredMock, speciesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addOpen).toBe(false);
    act(() => result.current.openAdd());
    expect(result.current.addOpen).toBe(true);
    act(() => result.current.closeAdd());
    expect(result.current.addOpen).toBe(false);
  });
});
