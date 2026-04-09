/**
 * Tests for SessionLocationsSection.
 *
 * - Empty state when no locations are linked
 * - Renders linked location names from the session entity
 *
 * The picker location list comes from `useLocations(campaignId)` and the
 * inline `LocationIcon` queries `locationTypes`, so both mocks are required
 * even when the picker is closed.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { SessionLocationsSection } from './SessionLocationsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

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
  query LocationTypes($campaignId: ID!) {
    locationTypes(campaignId: $campaignId) {
      id name icon category biomeOptions isSettlement builtin
    }
  }
`;

const locationsMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { locations: [] } },
};

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { locationTypes: [] } },
};

const baseSession: Session = {
  id: 's-1',
  campaignId: 'camp-1',
  number: 1,
  title: 'The Beginning',
  datetime: '2026-04-01T20:00:00Z',
  brief: '',
  summary: '',
  createdAt: '2026-04-01',
  locationIds: [],
  npcs: [],
  locations: [],
  quests: [],
};

describe('SessionLocationsSection', () => {
  it('shows empty state when no locations are linked', () => {
    renderWithProviders(
      <SessionLocationsSection
        campaignId="camp-1"
        session={baseSession}
        isGm={true}
        partyEnabled={false}
        locationTypesEnabled={false}
      />,
      { mocks: [locationsMock, locationTypesMock] },
    );
    expect(screen.getByText('no_locations_tagged')).toBeInTheDocument();
  });

  it('renders linked location names when present', () => {
    const session: Session = {
      ...baseSession,
      locationIds: ['loc-1'],
      locations: [{ id: 'loc-1', name: 'The Prancing Pony', type: 'settlement', playerVisible: true, playerVisibleFields: [] }],
    };
    renderWithProviders(
      <SessionLocationsSection
        campaignId="camp-1"
        session={session}
        isGm={false}
        partyEnabled={false}
        locationTypesEnabled={false}
      />,
      { mocks: [locationsMock, locationTypesMock] },
    );
    expect(screen.getByText('The Prancing Pony')).toBeInTheDocument();
    expect(screen.queryByText('add')).not.toBeInTheDocument();
  });
});
