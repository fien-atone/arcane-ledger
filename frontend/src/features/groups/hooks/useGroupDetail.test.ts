/**
 * Tests for useGroupDetail hook.
 *
 * Mocks the two underlying GraphQL queries (CAMPAIGN_QUERY + GROUP_QUERY) and
 * asserts on the derived shape: role flag, section flags, campaign title.
 */
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useGroupDetail } from './useGroupDetail';
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

const GROUP_QUERY = gql`
  query Group($campaignId: ID!, $id: ID!) {
    group(campaignId: $campaignId, id: $id) {
      id campaignId name type aliases description goals symbols
      gmNotes playerVisible playerVisibleFields
      createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

const campaignMock = (myRole: string = 'GM') => ({
  request: { query: CAMPAIGN_QUERY, variables: { id: 'camp-1' } },
  result: {
    data: {
      campaign: {
        id: 'camp-1',
        title: 'Test Campaign',
        description: '',
        createdAt: '2026-01-01',
        archivedAt: null,
        myRole,
        enabledSections: ['GROUPS', 'GROUP_TYPES', 'PARTY'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
});

const groupMock = {
  request: { query: GROUP_QUERY, variables: { campaignId: 'camp-1', id: 'g-1' } },
  result: {
    data: {
      group: {
        id: 'g-1',
        campaignId: 'camp-1',
        name: 'The Silver Hand',
        type: 'faction',
        aliases: [],
        description: '',
        goals: '',
        symbols: '',
        gmNotes: '',
        playerVisible: true,
        playerVisibleFields: [],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
        members: [],
      },
    },
  },
};

describe('useGroupDetail', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useGroupDetail('camp-1', 'g-1'), {
      mocks: [campaignMock('GM'), groupMock],
      initialRoute: '/campaigns/camp-1/groups/g-1',
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.group).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.group).toBeDefined();
    expect(result.current.group?.name).toBe('The Silver Hand');
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.isGm).toBe(true);

    // Section flags derived from enabledSections
    expect(result.current.groupsEnabled).toBe(true);
    expect(result.current.groupTypesEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);

    // Handlers are callable
    expect(typeof result.current.handleDelete).toBe('function');
    expect(typeof result.current.saveField).toBe('function');
  });

  it('derives isGm=false when campaign role is PLAYER', async () => {
    const { result } = renderHookWithProviders(() => useGroupDetail('camp-1', 'g-1'), {
      mocks: [campaignMock('PLAYER'), groupMock],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isGm).toBe(false);
  });
});
