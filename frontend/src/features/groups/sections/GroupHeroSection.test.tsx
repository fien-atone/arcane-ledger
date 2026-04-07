/**
 * Tests for GroupHeroSection — header card with type pill, name, aliases,
 * and edit/delete actions.
 *
 * The section renders a GroupEditDrawer (initially closed); the drawer
 * internally calls useGroupTypes + useSectionEnabled, so we provide mocks
 * for both GroupTypes and Campaign queries.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { gql } from '@apollo/client';
import { GroupHeroSection } from './GroupHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { Group } from '@/entities/group';

const GROUP_TYPES_QUERY = gql`
  query GroupTypes($campaignId: ID!, $search: String) {
    groupTypes(campaignId: $campaignId, search: $search) {
      id campaignId name icon description
    }
  }
`;

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

const groupTypesMock = {
  request: { query: GROUP_TYPES_QUERY, variables: { campaignId: 'camp-1', search: null } },
  result: { data: { groupTypes: [] } },
};

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
        enabledSections: ['GROUPS', 'GROUP_TYPES'],
        sessionCount: 0,
        memberCount: 1,
        lastSession: null,
      },
    },
  },
};

const baseGroup: Group = {
  id: 'g-1',
  campaignId: 'camp-1',
  name: 'The Silver Hand',
  type: 'faction',
  aliases: ['The Gauntlets'],
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('GroupHeroSection', () => {
  it('renders the group name and aliases', () => {
    renderWithProviders(
      <GroupHeroSection
        campaignId="camp-1"
        group={baseGroup}
        isGm={false}
        groupTypesEnabled={true}
        onDelete={() => {}}
      />,
      { mocks: [groupTypesMock, campaignMock] },
    );
    expect(screen.getByRole('heading', { name: 'The Silver Hand' })).toBeInTheDocument();
    expect(screen.getByText(/The Gauntlets/)).toBeInTheDocument();
  });

  it('shows the edit button for GM viewers', () => {
    renderWithProviders(
      <GroupHeroSection
        campaignId="camp-1"
        group={baseGroup}
        isGm={true}
        groupTypesEnabled={true}
        onDelete={() => {}}
      />,
      { mocks: [groupTypesMock, campaignMock] },
    );
    // 'edit' is the i18n key for the edit button label — there are two
    // matches (the icon text and the label) so we use getAllByText.
    expect(screen.getAllByText('edit').length).toBeGreaterThan(0);
  });

  it('hides the edit button for non-GM viewers', () => {
    renderWithProviders(
      <GroupHeroSection
        campaignId="camp-1"
        group={baseGroup}
        isGm={false}
        groupTypesEnabled={true}
        onDelete={() => {}}
      />,
      { mocks: [groupTypesMock, campaignMock] },
    );
    expect(screen.queryByText('edit')).not.toBeInTheDocument();
  });
});
