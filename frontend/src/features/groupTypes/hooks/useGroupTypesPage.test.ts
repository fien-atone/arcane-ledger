/**
 * Tests for useGroupTypesPage hook.
 *
 * Mocks the two underlying GraphQL queries (CAMPAIGN_QUERY + GROUP_TYPES_QUERY)
 * and asserts on the derived shape (loading flags, types list, selected entry)
 * and selection / showNew state transitions.
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useGroupTypesPage } from './useGroupTypesPage';
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
        enabledSections: ['GROUP_TYPES'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const groupTypesMock = {
  request: { query: GROUP_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: {
    data: {
      groupTypes: [
        { id: 'gt-1', campaignId: 'camp-1', name: 'Faction', icon: 'shield',   description: null },
        { id: 'gt-2', campaignId: 'camp-1', name: 'Guild',   icon: 'handshake', description: null },
        { id: 'gt-3', campaignId: 'camp-1', name: 'Cult',    icon: 'local_fire_department', description: null },
      ],
    },
  },
};

describe('useGroupTypesPage', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useGroupTypesPage('camp-1'), {
      mocks: [campaignMock, groupTypesMock],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.types).toHaveLength(3);
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.groupTypesEnabled).toBe(true);
    expect(result.current.isGm).toBe(true);

    // selected defaults to first entry
    expect(result.current.selected?.id).toBe('gt-1');
  });

  it('selectType updates selection and clears showNew', async () => {
    const { result } = renderHookWithProviders(() => useGroupTypesPage('camp-1'), {
      mocks: [campaignMock, groupTypesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startNew());
    expect(result.current.showNew).toBe(true);
    expect(result.current.selectedTypeId).toBeNull();

    act(() => result.current.selectType('gt-3'));
    expect(result.current.showNew).toBe(false);
    expect(result.current.selectedTypeId).toBe('gt-3');
    expect(result.current.selected?.id).toBe('gt-3');
  });

  it('finishCreate closes the new form and selects the saved id', async () => {
    const { result } = renderHookWithProviders(() => useGroupTypesPage('camp-1'), {
      mocks: [campaignMock, groupTypesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.startNew());
    expect(result.current.showNew).toBe(true);

    act(() => result.current.finishCreate('gt-2'));
    expect(result.current.showNew).toBe(false);
    expect(result.current.selectedTypeId).toBe('gt-2');
    expect(result.current.selected?.id).toBe('gt-2');
  });

  it('clearSelection drops the selection back to the first entry', async () => {
    const { result } = renderHookWithProviders(() => useGroupTypesPage('camp-1'), {
      mocks: [campaignMock, groupTypesMock],
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectType('gt-3'));
    expect(result.current.selected?.id).toBe('gt-3');

    act(() => result.current.clearSelection());
    expect(result.current.selectedTypeId).toBeNull();
    expect(result.current.selected?.id).toBe('gt-1');
  });
});
