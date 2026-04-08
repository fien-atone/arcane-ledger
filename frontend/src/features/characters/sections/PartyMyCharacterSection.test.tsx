/**
 * Tests for PartyMyCharacterSection — the "My Character" card.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { PartyMyCharacterSection } from './PartyMyCharacterSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const character: PlayerCharacter = {
  id: 'char-1',
  campaignId: 'camp-1',
  name: 'Aria',
  species: 'Human',
  class: 'Bard',
  gmNotes: '',
  groupMemberships: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('PartyMyCharacterSection', () => {
  it('renders the section header and the character name', () => {
    renderWithProviders(
      <PartyMyCharacterSection campaignId="camp-1" character={character} />,
    );
    expect(screen.getByText('section_my_character')).toBeInTheDocument();
    expect(screen.getByText('Aria')).toBeInTheDocument();
  });

  it('renders species and class joined with a middle dot', () => {
    renderWithProviders(
      <PartyMyCharacterSection campaignId="camp-1" character={character} />,
    );
    expect(screen.getByText(/Human/)).toBeInTheDocument();
    expect(screen.getByText(/Bard/)).toBeInTheDocument();
  });

  it('links to the character detail page', () => {
    renderWithProviders(
      <PartyMyCharacterSection campaignId="camp-1" character={character} />,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/campaigns/camp-1/characters/char-1');
  });
});
