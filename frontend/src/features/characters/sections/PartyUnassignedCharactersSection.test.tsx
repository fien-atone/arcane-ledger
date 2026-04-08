/**
 * Tests for PartyUnassignedCharactersSection.
 *
 * Verifies:
 * - Returns null when there are no unassigned characters
 * - Renders character rows with name + species/class line
 * - Hides the assign button when there are no players to assign to
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PartyUnassignedCharactersSection } from './PartyUnassignedCharactersSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const characters: PlayerCharacter[] = [
  {
    id: 'char-1',
    campaignId: 'camp-1',
    name: 'Lyra',
    species: 'Elf',
    class: 'Wizard',
    gmNotes: '',
    groupMemberships: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  },
];

describe('PartyUnassignedCharactersSection', () => {
  it('renders nothing when there are no unassigned characters', () => {
    const { container } = renderWithProviders(
      <PartyUnassignedCharactersSection
        characters={[]}
        campaignId="camp-1"
        membersWithoutCharacter={[]}
        isGm
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each unassigned character row', () => {
    renderWithProviders(
      <PartyUnassignedCharactersSection
        characters={characters}
        campaignId="camp-1"
        membersWithoutCharacter={[]}
        isGm={false}
      />,
    );
    expect(screen.getByText('Lyra')).toBeInTheDocument();
    expect(screen.getByText(/Elf/)).toBeInTheDocument();
    expect(screen.getByText('section_unassigned_characters')).toBeInTheDocument();
  });

  it('hides the assign button when no members are missing characters', () => {
    renderWithProviders(
      <PartyUnassignedCharactersSection
        characters={characters}
        campaignId="camp-1"
        membersWithoutCharacter={[]}
        isGm
      />,
    );
    expect(screen.queryByText('assign')).not.toBeInTheDocument();
  });

  it('shows the assign button for GMs when there are members without characters', () => {
    renderWithProviders(
      <PartyUnassignedCharactersSection
        characters={characters}
        campaignId="camp-1"
        membersWithoutCharacter={[{ userId: 'u-1', userName: 'Alice' }]}
        isGm
      />,
    );
    expect(screen.getByText('assign')).toBeInTheDocument();
  });
});
