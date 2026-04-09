/**
 * Tests for LocationParentSection — link card to the parent location.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { LocationParentSection } from './LocationParentSection';
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

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: { data: { locationTypes: [] } },
};

const emptyLocationsMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { locations: [] } },
};

const locationsWithParentMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: {
    data: {
      locations: [
        {
          id: 'loc-parent',
          campaignId: 'camp-1',
          name: 'Northern Reach',
          type: 'region',
          settlementPopulation: null,
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

const child: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
  parentLocationId: 'loc-parent',
};

describe('LocationParentSection', () => {
  it('renders nothing when the location has no parent', () => {
    const { container } = renderWithProviders(
      <LocationParentSection
        campaignId="camp-1"
        location={{ ...child, parentLocationId: undefined }}
        locationTypesEnabled={true}
      />,
      { mocks: [emptyLocationsMock, locationTypesMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the parent link when a parent exists', async () => {
    renderWithProviders(
      <LocationParentSection
        campaignId="camp-1"
        location={child}
        locationTypesEnabled={true}
      />,
      { mocks: [locationsWithParentMock, locationTypesMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('Northern Reach')).toBeInTheDocument();
    });
    expect(screen.getByText('section_part_of')).toBeInTheDocument();
  });
});
