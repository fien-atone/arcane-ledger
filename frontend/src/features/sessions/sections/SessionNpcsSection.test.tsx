/**
 * Tests for SessionNpcsSection.
 *
 * - Empty state when no NPCs are linked
 * - Displays linked NPC names from the session entity
 *
 * The picker NPC list comes from `useNpcs(campaignId)` so we always provide
 * an NPCS_QUERY mock even when the picker isn't open.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { SessionNpcsSection } from './SessionNpcsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

const NPCS_QUERY = gql`
  query Npcs($campaignId: ID!, $search: String, $status: String) {
    npcs(campaignId: $campaignId, search: $search, status: $status) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const npcsMock = {
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: { data: { npcs: [] } },
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
  npcIds: [],
  npcs: [],
  locations: [],
  quests: [],
};

describe('SessionNpcsSection', () => {
  it('shows empty state when no NPCs are linked', () => {
    renderWithProviders(
      <SessionNpcsSection
        campaignId="camp-1"
        session={baseSession}
        isGm={true}
        partyEnabled={false}
      />,
      { mocks: [npcsMock] },
    );
    expect(screen.getByText('no_npcs_tagged')).toBeInTheDocument();
  });

  it('renders linked NPC names when present', () => {
    const session: Session = {
      ...baseSession,
      npcIds: ['npc-1'],
      npcs: [{ id: 'npc-1', name: 'Borin Stonefist', species: 'dwarf', playerVisible: true, playerVisibleFields: [] }],
    };
    renderWithProviders(
      <SessionNpcsSection
        campaignId="camp-1"
        session={session}
        isGm={false}
        partyEnabled={false}
      />,
      { mocks: [npcsMock] },
    );
    expect(screen.getByText('Borin Stonefist')).toBeInTheDocument();
    // Non-GM should not see the add button
    expect(screen.queryByText('add')).not.toBeInTheDocument();
  });
});
