/**
 * Tests for SessionQuestsSection.
 *
 * - Empty state when no quests are linked
 * - Renders linked quest titles from the session entity
 *
 * The picker quest list comes from `useQuests(campaignId)` so we always
 * provide a QUESTS_QUERY mock matching the QUEST_FIELDS fragment used by
 * the queries module.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { SessionQuestsSection } from './SessionQuestsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Session } from '@/entities/session';

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

const questsMock = {
  request: { query: QUESTS_QUERY, variables: { campaignId: 'camp-1', search: null, status: null } },
  result: { data: { quests: [] } },
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
  questIds: [],
  npcs: [],
  locations: [],
  quests: [],
};

describe('SessionQuestsSection', () => {
  it('shows empty state when no quests are linked', () => {
    renderWithProviders(
      <SessionQuestsSection
        campaignId="camp-1"
        session={baseSession}
        isGm={true}
        partyEnabled={false}
      />,
      { mocks: [questsMock] },
    );
    expect(screen.getByText('no_quests_linked')).toBeInTheDocument();
  });

  it('renders linked quest titles when present', () => {
    const session: Session = {
      ...baseSession,
      questIds: ['q-1'],
      quests: [{ id: 'q-1', title: 'Slay the Dragon', status: 'active', playerVisible: true, playerVisibleFields: [] }],
    };
    renderWithProviders(
      <SessionQuestsSection
        campaignId="camp-1"
        session={session}
        isGm={false}
        partyEnabled={false}
      />,
      { mocks: [questsMock] },
    );
    expect(screen.getByText('Slay the Dragon')).toBeInTheDocument();
    expect(screen.queryByText('add')).not.toBeInTheDocument();
  });
});
