/**
 * Tests for QuestHeroSection — header card with status pill, title, and
 * edit/delete actions.
 *
 * The section always renders a QuestEditDrawer (initially closed). The drawer
 * mounts useCampaign + useNpcs even while closed, so we provide mocks for
 * both queries in every test.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { QuestHeroSection } from './QuestHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { Quest } from '@/entities/quest';

const CAMPAIGN_QUERY = gql`
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id
      title
      description
      createdAt
      archivedAt
      myRole
      enabledSections
      sessionCount
      memberCount
      lastSession {
        title
        datetime
      }
    }
  }
`;

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
        enabledSections: ['QUESTS', 'NPCS'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const npcsMock = {
  request: { query: NPCS_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { npcs: [] } },
};

const baseQuest: Quest = {
  id: 'q-1',
  campaignId: 'camp-1',
  title: 'Recover the Amulet',
  description: '',
  status: 'active',
  notes: '',
  createdAt: '2026-01-01',
};

describe('QuestHeroSection', () => {
  it('renders the quest title and status label', () => {
    renderWithProviders(
      <QuestHeroSection
        campaignId="camp-1"
        quest={baseQuest}
        isGm={false}
        onChangeStatus={() => {}}
        onDelete={() => {}}
      />,
      { mocks: [campaignMock, npcsMock] },
    );
    expect(screen.getByRole('heading', { name: 'Recover the Amulet' })).toBeInTheDocument();
    expect(screen.getByText('status_active')).toBeInTheDocument();
  });

  it('shows the edit button for GM viewers', () => {
    renderWithProviders(
      <QuestHeroSection
        campaignId="camp-1"
        quest={baseQuest}
        isGm={true}
        onChangeStatus={() => {}}
        onDelete={() => {}}
      />,
      { mocks: [campaignMock, npcsMock] },
    );
    // 'edit' is both the icon ligature text and the button label, so there
    // will be at least one occurrence for the GM.
    expect(screen.getAllByText('edit').length).toBeGreaterThan(0);
  });

  it('hides the edit button for non-GM viewers', () => {
    renderWithProviders(
      <QuestHeroSection
        campaignId="camp-1"
        quest={baseQuest}
        isGm={false}
        onChangeStatus={() => {}}
        onDelete={() => {}}
      />,
      { mocks: [campaignMock, npcsMock] },
    );
    expect(screen.queryByText('edit')).not.toBeInTheDocument();
  });
});
