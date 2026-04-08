/**
 * Tests for useSpeciesTypesPage hook.
 *
 * Mocks the two underlying GraphQL queries (CAMPAIGN_QUERY + SPECIES_TYPES_QUERY)
 * and asserts on the derived shape (loading flags, types list, selected entry)
 * and selection / showNew state transitions.
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useSpeciesTypesPage } from './useSpeciesTypesPage';
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
        enabledSections: ['SPECIES_TYPES'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const speciesTypesMock = {
  request: { query: SPECIES_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: {
    data: {
      speciesTypes: [
        { id: 'st-1', campaignId: 'camp-1', name: 'Humanoid', icon: 'person', description: null },
        { id: 'st-2', campaignId: 'camp-1', name: 'Beast',    icon: 'pets',   description: null },
        { id: 'st-3', campaignId: 'camp-1', name: 'Undead',   icon: 'skull',  description: null },
      ],
    },
  },
};

describe('useSpeciesTypesPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useSpeciesTypesPage('camp-1'), {
      mocks: [campaignMock, speciesTypesMock],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.types).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.speciesTypesEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // selected defaults to first entry
    expect(result.current.selected?.id).toBe('st-1');
  });

  it('selectType updates selection and clears showNew', async () => {
    const { result } = renderHookWithProviders(() => useSpeciesTypesPage('camp-1'), {
      mocks: [campaignMock, speciesTypesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startNew());
    expect(result.current.showNew).toBe(true);
    expect(result.current.selectedTypeId).toBeNull();

    act(() => result.current.selectType('st-3'));
    expect(result.current.showNew).toBe(false);
    expect(result.current.selectedTypeId).toBe('st-3');
    expect(result.current.selected?.id).toBe('st-3');
  });

  it('finishCreate closes the new form and selects the saved id', async () => {
    const { result } = renderHookWithProviders(() => useSpeciesTypesPage('camp-1'), {
      mocks: [campaignMock, speciesTypesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startNew());
    expect(result.current.showNew).toBe(true);

    act(() => result.current.finishCreate('st-2'));
    expect(result.current.showNew).toBe(false);
    expect(result.current.selectedTypeId).toBe('st-2');
    expect(result.current.selected?.id).toBe('st-2');
  });

  it('clearSelection drops the selection back to the first sorted entry', async () => {
    const { result } = renderHookWithProviders(() => useSpeciesTypesPage('camp-1'), {
      mocks: [campaignMock, speciesTypesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectType('st-3'));
    expect(result.current.selected?.id).toBe('st-3');

    act(() => result.current.clearSelection());
    expect(result.current.selectedTypeId).toBeNull();
    expect(result.current.selected?.id).toBe('st-1');
  });
});
