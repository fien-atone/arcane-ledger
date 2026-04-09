/**
 * Tests for NpcQuestsSection — lists quests where the NPC is the giver.
 *
 * - Renders nothing if quests module disabled
 * - Renders nothing if NPC has no quests as giver (not just an empty panel)
 * - Lists quests when NPC is giver, with visibility toggle only for GM+party
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { NpcQuestsSection } from './NpcQuestsSection';
import { renderWithProviders } from '@/test/helpers';

const QUESTS_QUERY = gql`
  query Quests($campaignId: ID!, $search: String, $status: String) {
    quests(campaignId: $campaignId, search: $search, status: $status) {
      id
      campaignId
      title
      description
      giverId
      reward
      status
      notes
      playerVisible
      playerVisibleFields
      createdAt
      giver { id name species image }
      sessions { id number title datetime }
    }
  }
`;

const emptyQuestsMock = {
  request: { query: QUESTS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: { data: { quests: [] } },
};

const questsForNpcMock = {
  request: { query: QUESTS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: {
    data: {
      quests: [
        {
          id: 'q-1',
          campaignId: 'camp-1',
          title: 'Find the Sword',
          description: '',
          giverId: 'npc-1',
          reward: '',
          status: 'ACTIVE',
          notes: '',
          playerVisible: true,
          playerVisibleFields: [],
          createdAt: '2026-01-01',
          giver: null,
          sessions: [],
        },
      ],
    },
  },
};

describe('NpcQuestsSection', () => {
  it('renders nothing when quests module is disabled', () => {
    const { container } = renderWithProviders(
      <NpcQuestsSection campaignId="camp-1" npcId="npc-1" isGm={true} enabled={false} partyEnabled={true} />,
      { mocks: [emptyQuestsMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when NPC has no quests as giver', async () => {
    const { container } = renderWithProviders(
      <NpcQuestsSection campaignId="camp-1" npcId="npc-1" isGm={true} enabled={true} partyEnabled={true} />,
      { mocks: [emptyQuestsMock] },
    );
    // Wait for query to resolve
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders quest list when NPC is a giver', async () => {
    renderWithProviders(
      <NpcQuestsSection campaignId="camp-1" npcId="npc-1" isGm={true} enabled={true} partyEnabled={true} />,
      { mocks: [questsForNpcMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('Find the Sword')).toBeInTheDocument();
    });
  });
});
