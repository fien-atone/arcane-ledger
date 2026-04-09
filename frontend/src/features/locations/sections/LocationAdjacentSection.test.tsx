/**
 * Tests for LocationAdjacentSection — adjacent / reachable locations.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { LocationAdjacentSection } from './LocationAdjacentSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

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
  query LocationTypes($campaignId: ID!, $search: String) {
    locationTypes(campaignId: $campaignId, search: $search) {
      id name icon category biomeOptions isSettlement builtin
    }
  }
`;

const baseLocation: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
};

const emptyLocationsMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { locations: [] } },
};

const locationsWithAdjacentMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: {
    data: {
      locations: [
        {
          id: 'loc-2',
          campaignId: 'camp-1',
          name: 'Riverford',
          type: 'settlement',
          settlementPopulation: 400,
          biome: null,
          parentLocationId: null,
          description: '',
          image: null,
          gmNotes: null,
          playerVisible: true,
          playerVisibleFields: [],
          createdAt: '2026-01-01',
          mapMarkers: [],
        },
      ],
    },
  },
};

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: { data: { locationTypes: [] } },
};

describe('LocationAdjacentSection', () => {
  it('renders nothing when the location has no adjacent ids', () => {
    const { container } = renderWithProviders(
      <LocationAdjacentSection
        campaignId="camp-1"
        location={baseLocation}
        locationTypesEnabled={true}
      />,
      { mocks: [emptyLocationsMock, locationTypesMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders linked adjacent locations', async () => {
    renderWithProviders(
      <LocationAdjacentSection
        campaignId="camp-1"
        location={{ ...baseLocation, adjacentLocationIds: ['loc-2'] }}
        locationTypesEnabled={true}
      />,
      { mocks: [locationsWithAdjacentMock, locationTypesMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('Riverford')).toBeInTheDocument();
    });
    expect(screen.getByText('adjacent_reachable')).toBeInTheDocument();
  });
});
