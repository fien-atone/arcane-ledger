/**
 * Tests for LocationSessionsSection — sessions where this location appeared.
 */
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { LocationSessionsSection } from './LocationSessionsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';

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

const baseLocation: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Silverhold',
  type: 'settlement',
  description: '',
  createdAt: '2026-01-01',
};

const emptySessionsMock = {
  request: { query: SESSIONS_QUERY, variables: { campaignId: 'camp-1' } },
  result: { data: { sessions: [] } },
};

const sessionsWithLocationMock = {
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
          npcs: [],
          locations: [{ id: 'loc-1', name: 'Silverhold', type: 'settlement', playerVisible: true, playerVisibleFields: [] }],
          quests: [],
          myNote: null,
        },
      ],
    },
  },
};

describe('LocationSessionsSection', () => {
  it('renders nothing when the sessions module is disabled', () => {
    const { container } = renderWithProviders(
      <LocationSessionsSection campaignId="camp-1" location={baseLocation} enabled={false} />,
      { mocks: [emptySessionsMock] },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the empty state when no sessions reference this location', async () => {
    renderWithProviders(
      <LocationSessionsSection campaignId="camp-1" location={baseLocation} enabled={true} />,
      { mocks: [emptySessionsMock] },
    );
    await waitFor(() => {
      expect(screen.getByText('no_sessions_tagged')).toBeInTheDocument();
    });
  });

  it('lists sessions that reference this location', async () => {
    renderWithProviders(
      <LocationSessionsSection campaignId="camp-1" location={baseLocation} enabled={true} />,
      { mocks: [sessionsWithLocationMock] },
    );
    await waitFor(() => {
      expect(screen.queryByText('no_sessions_tagged')).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('link').length).toBe(1);
  });
});
