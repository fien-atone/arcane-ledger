/**
 * Tests for LocationHeroSection — header card with type pill, title, and
 * edit/delete actions.
 *
 * The section fetches location types itself and also mounts a (closed)
 * LocationEditDrawer; the drawer pulls in useCampaign + useLocations +
 * useContainmentRules. We provide all four mocks.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { LocationHeroSection } from './LocationHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

const LOCATION_TYPES_QUERY = gql`
  query LocationTypes($campaignId: ID!) {
    locationTypes(campaignId: $campaignId) {
      id name icon category biomeOptions isSettlement builtin
    }
  }
`;

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

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { locationTypes: [] } },
};

const locationsMock = {
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { locations: [] } },
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

const allMocks = [locationTypesMock, locationsMock, containmentRulesMock, campaignMock];

const baseLocation: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
};

describe('LocationHeroSection', () => {
  it('renders the location name', () => {
    renderWithProviders(
      <LocationHeroSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={false}
        locationTypesEnabled={true}
        onDelete={() => {}}
      />,
      { mocks: allMocks },
    );
    expect(screen.getByRole('heading', { name: 'Silverhold' })).toBeInTheDocument();
  });

  it('shows the edit button for GM viewers', () => {
    renderWithProviders(
      <LocationHeroSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={true}
        locationTypesEnabled={true}
        onDelete={() => {}}
      />,
      { mocks: allMocks },
    );
    // 'edit' is both the icon ligature text and the i18n button label.
    expect(screen.getAllByText('edit').length).toBeGreaterThan(0);
  });

  it('hides the edit button for non-GM viewers', () => {
    renderWithProviders(
      <LocationHeroSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={false}
        locationTypesEnabled={true}
        onDelete={() => {}}
      />,
      { mocks: allMocks },
    );
    expect(screen.queryByText('edit')).not.toBeInTheDocument();
  });
});
