/**
 * Tests for useLocationDetail hook.
 *
 * Mocks the two underlying GraphQL queries (CAMPAIGN_QUERY + LOCATION_QUERY)
 * and asserts on the derived shape: role flag, section flags, campaign title.
 */
import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useLocationDetail } from './useLocationDetail';
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

const LOCATION_QUERY = gql`
  query Location($campaignId: ID!, $id: ID!) {
    location(campaignId: $campaignId, id: $id) {
      id campaignId name type settlementPopulation biome
      parentLocationId description image gmNotes
      playerVisible playerVisibleFields
      createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
      children { id name type playerVisible playerVisibleFields }
      npcsHere { id name status }
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
        enabledSections: ['LOCATIONS', 'NPCS', 'SESSIONS', 'LOCATION_TYPES', 'PARTY'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
});

const locationMock = {
  request: { query: LOCATION_QUERY, variables: { campaignId: 'camp-1', id: 'loc-1' } },
  result: {
    data: {
      location: {
        id: 'loc-1',
        campaignId: 'camp-1',
        name: 'Silverhold',
        type: 'settlement',
        settlementPopulation: 1200,
        biome: null,
        parentLocationId: null,
        description: '<p>A walled city.</p>',
        image: null,
        gmNotes: null,
        playerVisible: true,
        playerVisibleFields: [],
        createdAt: '2026-01-01',
        mapMarkers: [],
        children: [],
        npcsHere: [],
      },
    },
  },
};

describe('useLocationDetail', () => {
  it('returns expected shape after loading', async () => {
    const { result } = renderHookWithProviders(() => useLocationDetail('camp-1', 'loc-1'), {
      mocks: [campaignMock('GM'), locationMock],
      initialRoute: '/campaigns/camp-1/locations/loc-1',
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.location).toBeUndefined();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.location).toBeDefined();
    expect(result.current.location?.name).toBe('Silverhold');
    expect(result.current.campaignTitle).toBe('Test Campaign');
    expect(result.current.isGm).toBe(true);

    // Section flags derived from enabledSections
    expect(result.current.locationsEnabled).toBe(true);
    expect(result.current.npcsEnabled).toBe(true);
    expect(result.current.sessionsEnabled).toBe(true);
    expect(result.current.locationTypesEnabled).toBe(true);
    expect(result.current.partyEnabled).toBe(true);

    // Handlers are callable
    expect(typeof result.current.handleDelete).toBe('function');
    expect(typeof result.current.saveField).toBe('function');
    expect(typeof result.current.saveMarkers).toBe('function');
    expect(typeof result.current.handleImageUpload).toBe('function');
  });

  it('derives isGm=false when campaign role is PLAYER', async () => {
    const { result } = renderHookWithProviders(() => useLocationDetail('camp-1', 'loc-1'), {
      mocks: [campaignMock('PLAYER'), locationMock],
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isGm).toBe(false);
  });
});
