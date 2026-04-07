/**
 * Tests for GroupMembersSection — list of NPCs and party characters in a group.
 *
 * The section fetches NPCs (always) and Party (always — partyEnabled only
 * controls whether they're rendered). We mock both queries; the empty case
 * exercises the "no_members" empty state, the populated case exercises the
 * NPC row + the GM-only "add" button.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { GroupMembersSection } from './GroupMembersSection';
import { renderWithProviders } from '@/test/helpers';

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

const PARTY_QUERY = gql`
  query Party($campaignId: ID!) {
    party(campaignId: $campaignId) {
      id
      campaignId
      userId
      name
      gender
      age
      species
      speciesId
      class
      appearance
      background
      personality
      motivation
      bonds
      flaws
      gmNotes
      image
      groupMemberships { groupId relation subfaction }
      createdAt
      updatedAt
    }
  }
`;

const npcsMock = (npcs: any[]) => ({
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { npcs } },
});

const partyMock = (party: any[] = []) => ({
  request: { query: PARTY_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { party } },
});

const baseNpc = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Sir Aldric',
  aliases: [],
  status: 'ALIVE',
  gender: null,
  age: null,
  species: 'Human',
  speciesId: null,
  appearance: null,
  personality: null,
  description: '',
  motivation: null,
  flaws: null,
  gmNotes: null,
  image: null,
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  locationPresences: [],
  groupMemberships: [{ groupId: 'g-1', relation: 'leader', subfaction: null, playerVisible: true }],
};

describe('GroupMembersSection', () => {
  it('renders the empty state when there are no members', async () => {
    renderWithProviders(
      <GroupMembersSection campaignId="camp-1" groupId="g-1" isGm={true} partyEnabled={true} />,
      { mocks: [npcsMock([]), partyMock([])] },
    );
    await waitFor(() => {
      expect(screen.getByText('no_members')).toBeInTheDocument();
    });
  });

  it('renders an NPC member fetched from the npcs query', async () => {
    renderWithProviders(
      <GroupMembersSection campaignId="camp-1" groupId="g-1" isGm={true} partyEnabled={true} />,
      { mocks: [npcsMock([baseNpc]), partyMock([])] },
    );
    await waitFor(() => {
      expect(screen.getByText('Sir Aldric')).toBeInTheDocument();
    });
  });

  it('hides the add button for non-GM viewers', async () => {
    renderWithProviders(
      <GroupMembersSection campaignId="camp-1" groupId="g-1" isGm={false} partyEnabled={true} />,
      { mocks: [npcsMock([baseNpc]), partyMock([])] },
    );
    await waitFor(() => {
      expect(screen.getByText('Sir Aldric')).toBeInTheDocument();
    });
    // 'add' is the i18n key for the add-member button label
    expect(screen.queryByText('add')).not.toBeInTheDocument();
  });
});
