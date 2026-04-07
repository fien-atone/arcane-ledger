/**
 * Tests for CharacterGroupMembershipsSection.
 *
 * Gated by canViewAll AND enabled section flag. We don't assert on group
 * list rendering (that would need Apollo mocks for useGroups) — just that
 * the gating works and the section title appears when allowed.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CharacterGroupMembershipsSection } from './CharacterGroupMembershipsSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const fakeCharacter: PlayerCharacter = {
  id: 'char-1',
  campaignId: 'camp-1',
  name: 'Test',
  gmNotes: '',
  groupMemberships: [],
  createdAt: '2026-01-01',
};

describe('CharacterGroupMembershipsSection', () => {
  it('renders nothing when canViewAll is false', () => {
    const { container } = renderWithProviders(
      <CharacterGroupMembershipsSection
        campaignId="camp-1"
        character={fakeCharacter}
        isGm={false}
        canViewAll={false}
        enabled={true}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when enabled is false', () => {
    const { container } = renderWithProviders(
      <CharacterGroupMembershipsSection
        campaignId="camp-1"
        character={fakeCharacter}
        isGm={true}
        canViewAll={true}
        enabled={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the section heading when canViewAll and enabled', () => {
    renderWithProviders(
      <CharacterGroupMembershipsSection
        campaignId="camp-1"
        character={fakeCharacter}
        isGm={false}
        canViewAll={true}
        enabled={true}
      />,
    );
    expect(screen.getByText('detail.section_group_memberships')).toBeInTheDocument();
    expect(screen.getByText('detail.no_group_memberships')).toBeInTheDocument();
  });
});
