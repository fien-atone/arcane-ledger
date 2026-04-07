/**
 * Tests for LocationNpcsSection — NPCs at this location.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { LocationNpcsSection } from './LocationNpcsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

const NPCS_QUERY = gql`
  query Npcs($campaignId: ID!) {
    npcs(campaignId: $campaignId) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
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

const emptyNpcsMock = {
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { npcs: [] } },
};

const npcsHereMock = {
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1' } },
  result: {
    data: {
      npcs: [
        {
          id: 'npc-1',
          campaignId: 'camp-1',
          name: 'Aldric the Wise',
          aliases: [],
          status: 'ALIVE',
          gender: null,
          age: null,
          species: null,
          speciesId: null,
          appearance: '',
          personality: '',
          description: '',
          motivation: '',
          flaws: '',
          gmNotes: null,
          image: null,
          playerVisible: true,
          playerVisibleFields: [],
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
          locationPresences: [{ locationId: 'loc-1', note: null, playerVisible: true }],
          groupMemberships: [],
        },
      ],
    },
  },
};

describe('LocationNpcsSection', () => {
  it('renders nothing when NPCs module is disabled', () => {
    const { container } = renderWithProviders(
      <LocationNpcsSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={true}
        enabled={false}
        partyEnabled={true}
      />,
      { mocks: [emptyNpcsMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the empty state when no NPCs are tagged here', async () => {
    renderWithProviders(
      <LocationNpcsSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={true}
        enabled={true}
        partyEnabled={true}
      />,
      { mocks: [emptyNpcsMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('no_npcs_tagged')).toBeInTheDocument();
    });
  });

  it('lists NPCs whose presences include this location', async () => {
    renderWithProviders(
      <LocationNpcsSection
        campaignId="camp-1"
        location={baseLocation}
        isGm={false}
        enabled={true}
        partyEnabled={true}
      />,
      { mocks: [npcsHereMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('Aldric the Wise')).toBeInTheDocument();
    });
  });
});
