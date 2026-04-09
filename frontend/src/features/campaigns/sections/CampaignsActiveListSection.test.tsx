/**
 * Tests for CampaignsActiveListSection — verifies empty behavior and the
 * rendered campaign rows with role-aware labels.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { CampaignsActiveListSection } from './CampaignsActiveListSection';
import { renderWithProviders } from '@/test/helpers';
import type { CampaignSummary } from '@/entities/campaign';

const SESSIONS_QUERY = gql`
  query Sessions($campaignId: ID!, $search: String) {
    sessions(campaignId: $campaignId, search: $search) {
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

const emptySessionsMock = (campaignId: string) => ({
  request: { query: SESSIONS_QUERY, variables: { campaignId, search: null } },
  result: { data: { sessions: [] } },
});

const gmCampaign: CampaignSummary = {
  id: 'c-gm',
  title: 'Ashes of Empire',
  description: undefined,
  createdAt: '2026-01-01',
  archivedAt: undefined,
  myRole: 'gm',
  enabledSections: ['sessions'],
  sessionCount: 0,
  memberCount: 1,
};

const playerCampaign: CampaignSummary = {
  id: 'c-player',
  title: 'Borderlands',
  description: undefined,
  createdAt: '2026-01-01',
  archivedAt: undefined,
  myRole: 'player',
  enabledSections: ['sessions'],
  sessionCount: 0,
  memberCount: 1,
};

describe('CampaignsActiveListSection', () => {
  it('renders nothing when the active list is empty', () => {
    const { container } = renderWithProviders(
      <CampaignsActiveListSection active={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders each active campaign with its title and role label', async () => {
    renderWithProviders(
      <CampaignsActiveListSection active={[gmCampaign, playerCampaign]} />,
      { mocks: [emptySessionsMock('c-gm'), emptySessionsMock('c-player')] },
    );
    expect(screen.getByText('Ashes of Empire')).toBeInTheDocument();
    expect(screen.getByText('Borderlands')).toBeInTheDocument();
    expect(screen.getByText('roles.game_master')).toBeInTheDocument();
    expect(screen.getByText('roles.player')).toBeInTheDocument();
  });
});
