/**
 * Tests for NpcLocationsSection — lists places where the NPC has been seen.
 *
 * - Renders nothing if locations module disabled
 * - Resolves location names via the locations query
 * - Hides add button for non-GM viewers
 *
 * LocationIcon inside this section internally queries locationTypes, so we
 * mock that too even when there are no presences to display.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { NpcLocationsSection } from './NpcLocationsSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

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

const locationsMock = (locations: any[]) => ({
  request: { query: LOCATIONS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { locations } },
});

const locationTypesMock = {
  request: { query: LOCATION_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: { data: { locationTypes: [] } },
};

const baseNpc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Test',
  aliases: [],
  status: 'alive',
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  playerVisible: true,
  playerVisibleFields: [],
  locationPresences: [],
  groupMemberships: [],
  relations: [],
};

const npcAtLocation: NPC = {
  ...baseNpc,
  locationPresences: [
    { locationId: 'loc-1', note: 'At the inn', playerVisible: true },
  ],
};

const locationFixture = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'The Prancing Pony',
  type: 'settlement',
  settlementPopulation: null,
  biome: null,
  parentLocationId: null,
  description: '',
  image: null,
  gmNotes: '',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  mapMarkers: [],
};

describe('NpcLocationsSection', () => {
  it('renders nothing when locations module is disabled', () => {
    const { container } = renderWithProviders(
      <NpcLocationsSection
        campaignId="camp-1"
        npc={npcAtLocation}
        isGm={true}
        enabled={false}
        partyEnabled={true}
        locationTypesEnabled={false}
      />,
      { mocks: [locationsMock([locationFixture]), locationTypesMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('resolves and displays the location name from the locations query', async () => {
    renderWithProviders(
      <NpcLocationsSection
        campaignId="camp-1"
        npc={npcAtLocation}
        isGm={true}
        enabled={true}
        partyEnabled={true}
        locationTypesEnabled={false}
      />,
      { mocks: [locationsMock([locationFixture]), locationTypesMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('The Prancing Pony')).toBeInTheDocument();
    });
  });

  it('hides the add button for non-GM viewers', async () => {
    renderWithProviders(
      <NpcLocationsSection
        campaignId="camp-1"
        npc={npcAtLocation}
        isGm={false}
        enabled={true}
        partyEnabled={false}
        locationTypesEnabled={false}
      />,
      { mocks: [locationsMock([locationFixture]), locationTypesMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('The Prancing Pony')).toBeInTheDocument();
    });
    expect(screen.queryByText('add')).not.toBeInTheDocument();
  });
});
