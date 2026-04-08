/**
 * Tests for useNpcListPage hook.
 *
 * Mocks the three underlying GraphQL queries (CAMPAIGN + NPCS + SPECIES)
 * and asserts on:
 *  - the derived shape (loading flags, filtered list, statusFilters)
 *  - search / statusFilter state transitions
 *  - resolveSpeciesName preferring the species catalog
 *  - openAdd / closeAdd drawer state
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
  query Npcs($campaignId: ID!) {
    npcs(campaignId: $campaignId) {
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
  query Species($campaignId: ID!) {
    species(campaignId: $campaignId) {
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

const npcsMock = {
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1' } },
  result: {
    data: {
      npcs: [
        {
          ...baseNpc,
          id: 'npc-1',
          name: 'Aldric Thorne',
          aliases: ['The Grey'],
          status: 'alive',
          speciesId: 'sp-human',
        },
        {
          ...baseNpc,
          id: 'npc-2',
          name: 'Mira Vale',
          aliases: [],
          status: 'dead',
          speciesId: null,
          species: 'Elf',
        },
        {
          ...baseNpc,
          id: 'npc-3',
          name: 'Borin',
          aliases: [],
          status: 'missing',
        },
      ],
    },
  },
};

const speciesMock = {
  request: { query: SPECIES_QUERY, variables: { campaignId: 'camp-1' } },
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
      { mocks: [campaignMock, npcsMock, speciesMock] },
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

    // statusFilters: all + 4 statuses = 5 entries
    expect(result.current.statusFilters).toHaveLength(5);
    expect(result.current.statusFilters[0]).toMatchObject({
      value: 'all',
      count: 3,
    });
    expect(
      result.current.statusFilters.find((f) => f.value === 'alive')?.count,
    ).toBe(1);
    expect(
      result.current.statusFilters.find((f) => f.value === 'dead')?.count,
    ).toBe(1);

    // Default (all, no search): all 3 NPCs
    expect(result.current.filtered).toHaveLength(3);

    // resolveSpeciesName prefers the species catalog
    const aldric = result.current.npcs!.find((n) => n.id === 'npc-1')!;
    expect(result.current.resolveSpeciesName(aldric)).toBe('Human');
    // Falls back to free-text species
    const mira = result.current.npcs!.find((n) => n.id === 'npc-2')!;
    expect(result.current.resolveSpeciesName(mira)).toBe('Elf');
  });

  it('search filters by name and aliases', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsMock, speciesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('grey'));
    await waitFor(() => expect(result.current.search).toBe('grey'));
    // Matches alias "The Grey"
    expect(result.current.filtered.map((n) => n.id)).toEqual(['npc-1']);

    act(() => result.current.setSearch('mira'));
    await waitFor(() => expect(result.current.search).toBe('mira'));
    expect(result.current.filtered.map((n) => n.id)).toEqual(['npc-2']);
  });

  it('statusFilter narrows results to a single status', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsMock, speciesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setStatusFilter('dead'));
    await waitFor(() => expect(result.current.statusFilter).toBe('dead'));
    expect(result.current.filtered.map((n) => n.id)).toEqual(['npc-2']);
  });

  it('openAdd / closeAdd toggles the drawer state', async () => {
    const { result } = renderHookWithProviders(
      () => useNpcListPage('camp-1'),
      { mocks: [campaignMock, npcsMock, speciesMock] },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.addOpen).toBe(false);
    act(() => result.current.openAdd());
    expect(result.current.addOpen).toBe(true);
    act(() => result.current.closeAdd());
    expect(result.current.addOpen).toBe(false);
  });
});
