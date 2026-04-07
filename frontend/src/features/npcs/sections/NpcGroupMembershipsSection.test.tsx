/**
 * Tests for NpcGroupMembershipsSection.
 *
 * - Renders nothing if groups module disabled
 * - Resolves group names from the groups query
 * - Hides "add" button for non-GM viewers
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { NpcGroupMembershipsSection } from './NpcGroupMembershipsSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const GROUPS_QUERY = gql`
  query Groups($campaignId: ID!, $search: String, $type: String) {
    groups(campaignId: $campaignId, search: $search, type: $type) {
      id campaignId name type aliases description goals symbols
      gmNotes playerVisible playerVisibleFields
      createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

const groupsMock = (groups: any[]) => ({
  request: { query: GROUPS_QUERY, variables: { campaignId: 'camp-1', search: null, type: null } },
  result: { data: { groups } },
});

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

const npcWithMembership: NPC = {
  ...baseNpc,
  groupMemberships: [
    { npcId: 'npc-1', groupId: 'g-1', relation: 'leader', subfaction: undefined, playerVisible: true },
  ],
};

const groupFixture = {
  id: 'g-1',
  campaignId: 'camp-1',
  name: 'The Silver Hand',
  type: 'faction',
  aliases: [],
  description: '',
  goals: '',
  symbols: '',
  gmNotes: '',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  members: [],
};

describe('NpcGroupMembershipsSection', () => {
  it('renders nothing when groups module is disabled', () => {
    const { container } = renderWithProviders(
      <NpcGroupMembershipsSection campaignId="camp-1" npc={npcWithMembership} isGm={true} enabled={false} partyEnabled={true} />,
      { mocks: [groupsMock([groupFixture])] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('resolves and displays the group name from the groups query', async () => {
    renderWithProviders(
      <NpcGroupMembershipsSection campaignId="camp-1" npc={npcWithMembership} isGm={true} enabled={true} partyEnabled={true} />,
      { mocks: [groupsMock([groupFixture])] },
    );
    await waitFor(() => {
      expect(screen.getByText('The Silver Hand')).toBeInTheDocument();
    });
  });

  it('hides the add button for non-GM viewers', async () => {
    renderWithProviders(
      <NpcGroupMembershipsSection campaignId="camp-1" npc={npcWithMembership} isGm={false} enabled={true} partyEnabled={false} />,
      { mocks: [groupsMock([groupFixture])] },
    );
    await waitFor(() => {
      expect(screen.getByText('The Silver Hand')).toBeInTheDocument();
    });
    // 'add' is the i18n key for the add button
    expect(screen.queryByText('add')).not.toBeInTheDocument();
  });
});
