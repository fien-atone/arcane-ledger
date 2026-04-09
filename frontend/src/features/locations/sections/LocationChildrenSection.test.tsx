/**
 * Tests for LocationChildrenSection — "Notable Places" list of children.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { LocationChildrenSection } from './LocationChildrenSection';
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

const CONTAINMENT_RULES_QUERY = gql`
  query ContainmentRules {
    containmentRules {
      id parentTypeId childTypeId
    }
  }
`;

const CAMPAIGN_QUERY = gql`
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id title description createdAt archivedAt myRole
      enabledSections sessionCount memberCount
      lastSession { title datetime }
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

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: { data: { locationTypes: [] } },
};

const containmentRulesMock = {
  request: { query: CONTAINMENT_RULES_QUERY },
  result: { data: { containmentRules: [] } },
};

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
        enabledSections: ['LOCATIONS', 'LOCATION_TYPES'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const emptyLocationsMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { locations: [] } },
};

const locationsWithChildrenMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: {
    data: {
      locations: [
        {
          id: 'loc-child',
          campaignId: 'camp-1',
          name: 'The Old Tower',
          type: 'landmark',
          settlementPopulation: null,
          biome: null,
          parentLocationId: 'loc-1',
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

describe('LocationChildrenSection', () => {
  it('shows the empty state when there are no child locations', async () => {
    renderWithProviders(
      <LocationChildrenSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={false}
        partyEnabled={false}
        locationTypesEnabled={true}
      />,
      { mocks: [emptyLocationsMock, locationTypesMock, containmentRulesMock, campaignMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('no_notable_places')).toBeInTheDocument();
    });
  });

  it('lists child locations whose parentLocationId matches', async () => {
    renderWithProviders(
      <LocationChildrenSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={false}
        partyEnabled={false}
        locationTypesEnabled={true}
      />,
      { mocks: [locationsWithChildrenMock, locationTypesMock, containmentRulesMock, campaignMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('The Old Tower')).toBeInTheDocument();
    });
  });
});
