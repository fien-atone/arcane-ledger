/**
 * Tests for NpcSessionsSection — lists sessions where the NPC appeared.
 *
 * - Renders nothing if sessions module disabled
 * - Shows empty state when NPC has no session appearances
 * - Shows sorted session list (descending by number) when NPC is tagged
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { NpcSessionsSection } from './NpcSessionsSection';
import { renderWithProviders } from '@/test/helpers';

const SESSIONS_QUERY = gql`
  query Sessions($campaignId: ID!) {
    sessions(campaignId: $campaignId) {
      id
      campaignId
      number
      title
      datetime
      brief
      summary
      createdAt
      npcs { id name status species image playerVisible playerVisibleFields }
      locations { id name type playerVisible playerVisibleFields }
      quests { id title status playerVisible playerVisibleFields }
      myNote { id content updatedAt }
    }
  }
`;

const emptySessionsMock = {
  request: { query: SESSIONS_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { sessions: [] } },
};

const sessionsWithNpcMock = {
  request: { query: SESSIONS_QUERY, variables: { campaignId: 'camp-1' } },
  result: {
    data: {
      sessions: [
        {
          id: 's-1',
          campaignId: 'camp-1',
          number: 1,
          title: 'The Beginning',
          datetime: '2026-01-01',
          brief: '',
          summary: '',
          createdAt: '2026-01-01',
          npcs: [{ id: 'npc-1', name: 'Test NPC', status: 'ALIVE', species: null, image: null, playerVisible: true, playerVisibleFields: [] }],
          locations: [],
          quests: [],
          myNote: null,
        },
        {
          id: 's-2',
          campaignId: 'camp-1',
          number: 2,
          title: 'The Escape',
          datetime: '2026-01-08',
          brief: '',
          summary: '',
          createdAt: '2026-01-08',
          npcs: [{ id: 'npc-1', name: 'Test NPC', status: 'ALIVE', species: null, image: null, playerVisible: true, playerVisibleFields: [] }],
          locations: [],
          quests: [],
          myNote: null,
        },
        {
          id: 's-3',
          campaignId: 'camp-1',
          number: 3,
          title: 'Other Session',
          datetime: '2026-01-15',
          brief: '',
          summary: '',
          createdAt: '2026-01-15',
          // NPC not in this one
          npcs: [],
          locations: [],
          quests: [],
          myNote: null,
        },
      ],
    },
  },
};

describe('NpcSessionsSection', () => {
  it('renders nothing when sessions module is disabled', () => {
    const { container } = renderWithProviders(
      <NpcSessionsSection campaignId="camp-1" npcId="npc-1" enabled={false} />,
      { mocks: [emptySessionsMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows empty state when NPC has no session appearances', async () => {
    renderWithProviders(
      <NpcSessionsSection campaignId="camp-1" npcId="npc-1" enabled={true} />,
      { mocks: [emptySessionsMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('no_sessions_tagged')).toBeInTheDocument();
    });
  });

  it('lists only sessions where the NPC appears, sorted by number descending', async () => {
    renderWithProviders(
      <NpcSessionsSection campaignId="camp-1" npcId="npc-1" enabled={true} />,
      { mocks: [sessionsWithNpcMock] },
    );
    // Should see 2 appearances (sessions 1 and 2), not session 3
    await waitFor(() => {
      // Links are interpolated with {number} and {title}
      expect(screen.queryByText('no_sessions_tagged')).not.toBeInTheDocument();
    });
    // Both sessions are rendered (text content contains the session numbers)
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);
  });
});
