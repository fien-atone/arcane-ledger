/**
 * Tests for useLocationTypesPage hook.
 *
 * Mocks the three underlying GraphQL queries (CAMPAIGN_QUERY +
 * LOCATION_TYPES_QUERY + CONTAINMENT_RULES_QUERY) and asserts on:
 *  - the derived shape (loading flags, sorted list, selected entry)
 *  - selection / showNew state transitions via the helpers
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useLocationTypesPage } from './useLocationTypesPage';
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

const LOCATION_TYPES_QUERY = gql`
  query LocationTypes($campaignId: ID!, $search: String) {
    locationTypes(campaignId: $campaignId, search: $search) {
      id name icon category biomeOptions isSettlement builtin
    }
  }
`;

const CONTAINMENT_RULES_QUERY = gql`
  query ContainmentRules {
    containmentRules {
      id parentTypeId childTypeId
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
        enabledSections: ['LOCATION_TYPES'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: {
    data: {
      locationTypes: [
        { id: 'lt-1', name: 'Settlement', icon: 'apartment', category: 'civilization', biomeOptions: [], isSettlement: true, builtin: true },
        { id: 'lt-2', name: 'Continent',  icon: 'public',    category: 'world',        biomeOptions: [], isSettlement: false, builtin: true },
        { id: 'lt-3', name: 'Region',     icon: 'terrain',   category: 'geographic',   biomeOptions: [], isSettlement: false, builtin: false },
      ],
    },
  },
};

const containmentRulesMock = {
  request: { query: CONTAINMENT_RULES_QUERY },
  result: { data: { containmentRules: [] } },
};

describe('useLocationTypesPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useLocationTypesPage('camp-1'), {
      mocks: [campaignMock, locationTypesMock, containmentRulesMock],
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.types).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.locationTypesEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // Sorted by category order: world < civilization < geographic
    expect(result.current.sorted.map((t) => t.id)).toEqual(['lt-2', 'lt-1', 'lt-3']);

    // selected defaults to first sorted entry
    expect(result.current.selected?.id).toBe('lt-2');
  });

  it('selectType updates selection and clears showNew', async () => {
    const { result } = renderHookWithProviders(() => useLocationTypesPage('camp-1'), {
      mocks: [campaignMock, locationTypesMock, containmentRulesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startNew());
    expect(result.current.showNew).toBe(true);
    expect(result.current.selectedTypeId).toBeNull();

    act(() => result.current.selectType('lt-3'));
    expect(result.current.showNew).toBe(false);
    expect(result.current.selectedTypeId).toBe('lt-3');
    expect(result.current.selected?.id).toBe('lt-3');
  });

  it('pushes debounced search into the GraphQL query variable (server-side)', async () => {
    // Typing into the search input should, after the debounce delay, fire a
    // new GraphQL query with the search variable set. The filtered list in
    // the result is whatever the server returns — not a client-side filter.
    const searchMock = {
      request: {
        query: LOCATION_TYPES_QUERY,
        variables: { campaignId: 'camp-1', search: 'reg' },
      },
      result: {
        data: {
          locationTypes: [
            {
              id: 'lt-3',
              name: 'Region',
              icon: 'terrain',
              category: 'geographic',
              biomeOptions: [],
              isSettlement: false,
              builtin: false,
            },
          ],
        },
      },
    };

    const { result } = renderHookWithProviders(() => useLocationTypesPage('camp-1'), {
      mocks: [campaignMock, locationTypesMock, containmentRulesMock, searchMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setSearch('reg'));
    // Input value updates instantly
    expect(result.current.search).toBe('reg');

    // After the debounce delay, the server returns the narrowed list
    await waitFor(() => {
      expect(result.current.filtered).toHaveLength(1);
      expect(result.current.filtered[0]?.id).toBe('lt-3');
    });
  });
});
