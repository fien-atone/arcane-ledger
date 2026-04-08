/**
 * Tests for useCampaignDashboard — covers GM flag derivation, enabled
 * sections membership check, and title-draft edit lifecycle.
 */
import { describe, it, expect } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useCampaignDashboard } from './useCampaignDashboard';
import { renderHookWithProviders } from '@/test/helpers';

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

const campaignMock = {
  request: { query: CAMPAIGN_QUERY, variables: { id: 'camp-1' } },
  result: {
    data: {
      campaign: {
        id: 'camp-1',
        title: 'My Campaign',
        description: '<p>Desc</p>',
        createdAt: '2026-01-01',
        archivedAt: null,
        myRole: 'GM',
        enabledSections: ['SESSIONS', 'NPCS', 'PARTY'],
        sessionCount: 2,
        memberCount: 3,
        lastSession: null,
      },
    },
  },
};

describe('useCampaignDashboard', () => {
  it('loads campaign and derives isGm + sectionOn', async () => {
    const { result } = renderHookWithProviders(
      () => useCampaignDashboard('camp-1'),
      { mocks: [campaignMock] },
    );
    await waitFor(() => expect(result.current.campaign).toBeDefined());
    expect(result.current.isGm).toBe(true);
    expect(result.current.sectionOn('sessions')).toBe(true);
    expect(result.current.sectionOn('quests')).toBe(false);
  });

  it('startEditTitle populates titleDraft and toggles editingTitle', async () => {
    const { result } = renderHookWithProviders(
      () => useCampaignDashboard('camp-1'),
      { mocks: [campaignMock] },
    );
    await waitFor(() => expect(result.current.campaign).toBeDefined());
    act(() => result.current.startEditTitle());
    expect(result.current.editingTitle).toBe(true);
    expect(result.current.titleDraft).toBe('My Campaign');
    act(() => result.current.cancelEditTitle());
    expect(result.current.editingTitle).toBe(false);
  });

  it('setConfirmArchive toggles archive confirmation state', async () => {
    const { result } = renderHookWithProviders(
      () => useCampaignDashboard('camp-1'),
      { mocks: [campaignMock] },
    );
    await waitFor(() => expect(result.current.campaign).toBeDefined());
    expect(result.current.confirmArchive).toBe(false);
    act(() => result.current.setConfirmArchive(true));
    expect(result.current.confirmArchive).toBe(true);
  });
});
