/**
 * Tests for useSocialGraphPage hook.
 *
 * Mocks the 6 underlying GraphQL queries (CAMPAIGN + NPCS + PARTY + GROUPS
 * + GROUP_TYPES + RELATIONS_FOR_CAMPAIGN) and asserts on:
 *  - loading flags + derived shape (filteredNpcs, allGroups with virtual party)
 *  - status filter toggling (and the "can't remove all" safety rule)
 *  - group filter toggling
 *  - view mode setter
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useSocialGraphPage } from './useSocialGraphPage';
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

const PARTY_QUERY = gql`
  query Party($campaignId: ID!) {
    party(campaignId: $campaignId) {
      id
      campaignId
      userId
      name
      gender
      age
      species
      speciesId
      class
      appearance
      background
      personality
      motivation
      bonds
      flaws
      gmNotes
      image
      groupMemberships { groupId relation subfaction }
      createdAt
      updatedAt
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

const RELATIONS_FOR_CAMPAIGN_QUERY = gql`
  query RelationsForCampaign($campaignId: ID!) {
    relationsForCampaign(campaignId: $campaignId) {
      id campaignId
      fromEntity { type id }
      toEntity { type id }
      friendliness note createdAt updatedAt
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
        enabledSections: [
          'NPCS',
          'SOCIAL_GRAPH',
          'PARTY',
          'GROUPS',
          'GROUP_TYPES',
        ],
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
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: {
    data: {
      npcs: [
        {
          ...baseNpc,
          id: 'npc-1',
          name: 'Aldric',
          aliases: [],
          status: 'alive',
        },
        {
          ...baseNpc,
          id: 'npc-2',
          name: 'Mira',
          aliases: [],
          status: 'dead',
        },
        {
          ...baseNpc,
          id: 'npc-3',
          name: 'Borin',
          aliases: [],
          status: 'unknown',
        },
      ],
    },
  },
};

const partyMock = {
  request: { query: PARTY_QUERY, variables: { campaignId: 'camp-1' } },
  result: {
    data: {
      party: [
        {
          id: 'pc-1',
          campaignId: 'camp-1',
          userId: 'u-1',
          name: 'Hero',
          gender: null,
          age: null,
          species: null,
          speciesId: null,
          class: null,
          appearance: null,
          background: null,
          personality: null,
          motivation: null,
          bonds: null,
          flaws: null,
          gmNotes: null,
          image: null,
          groupMemberships: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ],
    },
  },
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
          id: 'g-1',
          campaignId: 'camp-1',
          name: 'The Guild',
          type: null,
          aliases: [],
          description: '',
          goals: [],
          symbols: [],
          gmNotes: null,
          playerVisible: true,
          playerVisibleFields: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          members: [],
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
  result: { data: { groupTypes: [] } },
};

const relationsMock = {
  request: {
    query: RELATIONS_FOR_CAMPAIGN_QUERY,
    variables: { campaignId: 'camp-1' },
  },
  result: { data: { relationsForCampaign: [] } },
};

const allMocks = [
  campaignMock,
  npcsMock,
  partyMock,
  groupsMock,
  groupTypesMock,
  relationsMock,
];

describe('useSocialGraphPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(
      () => useSocialGraphPage('camp-1'),
      { mocks: allMocks },
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Section flags
    expect(result.current.npcsEnabled).toBe(true);
    expect(result.current.socialGraphEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);
    expect(result.current.groupsEnabled).toBe(true);
    expect(result.current.groupTypesEnabled).toBe(true);
    expect(result.current.campaignTitle).toBe('Test Campaign');

    // Default view mode is chord
    expect(result.current.viewMode).toBe('chord');

    // Default status filters = alive + unknown → filteredNpcs has 2 NPCs
    // + 1 party character (alive) = 3
    await waitFor(() => {
      expect(result.current.filteredNpcs).toHaveLength(3);
    });

    // allGroups includes real group + virtual party group
    expect(result.current.allGroups).toHaveLength(2);
    expect(result.current.allGroups.map((g) => g.id)).toContain('__party__');
  });

  it('toggleStatus adds/removes statuses but keeps at least one', async () => {
    const { result } = renderHookWithProviders(
      () => useSocialGraphPage('camp-1'),
      { mocks: allMocks },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Initial: alive + unknown
    expect(result.current.statusFilters.has('alive')).toBe(true);
    expect(result.current.statusFilters.has('unknown')).toBe(true);

    // Add dead
    act(() => result.current.toggleStatus('dead'));
    expect(result.current.statusFilters.has('dead')).toBe(true);

    // Remove alive
    act(() => result.current.toggleStatus('alive'));
    expect(result.current.statusFilters.has('alive')).toBe(false);

    // Remove unknown
    act(() => result.current.toggleStatus('unknown'));
    expect(result.current.statusFilters.has('unknown')).toBe(false);

    // Only dead remains — trying to remove it is a no-op (safety rule)
    act(() => result.current.toggleStatus('dead'));
    expect(result.current.statusFilters.has('dead')).toBe(true);
    expect(result.current.statusFilters.size).toBe(1);
  });

  it('toggleGroup removes and re-adds a group from the filter set', async () => {
    const { result } = renderHookWithProviders(
      () => useSocialGraphPage('camp-1'),
      { mocks: allMocks },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Wait for the effect that initializes groupFilters with all groups
    await waitFor(() => {
      expect(result.current.activeGroupFilters.has('g-1')).toBe(true);
    });

    act(() => result.current.toggleGroup('g-1'));
    expect(result.current.activeGroupFilters.has('g-1')).toBe(false);

    act(() => result.current.toggleGroup('g-1'));
    expect(result.current.activeGroupFilters.has('g-1')).toBe(true);
  });

  it('setViewMode switches between chord and force', async () => {
    const { result } = renderHookWithProviders(
      () => useSocialGraphPage('camp-1'),
      { mocks: allMocks },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.viewMode).toBe('chord');
    act(() => result.current.setViewMode('force'));
    expect(result.current.viewMode).toBe('force');
    act(() => result.current.setViewMode('chord'));
    expect(result.current.viewMode).toBe('chord');
  });
});
