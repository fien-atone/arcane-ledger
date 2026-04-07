/**
 * Tests for CharacterBackgroundSection.
 *
 * Gated by canViewAll (GM or owning player). When canViewAll is false,
 * the section renders nothing.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CharacterBackgroundSection } from './CharacterBackgroundSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const fakeCharacter: PlayerCharacter = {
  id: 'char-1',
  campaignId: 'camp-1',
  name: 'Test',
  background: '<p>Raised by wolves.</p>',
  personality: '<p>Calm.</p>',
  motivation: '<p>Revenge.</p>',
  bonds: '<p>Sister.</p>',
  flaws: '<p>Proud.</p>',
  gmNotes: '',
  groupMemberships: [],
  createdAt: '2026-01-01',
};

describe('CharacterBackgroundSection', () => {
  it('renders backstory, personality, motivation, bonds, and flaws when canViewAll', () => {
    const { container } = renderWithProviders(
      <CharacterBackgroundSection
        character={fakeCharacter}
        isGm={true}
        canViewAll={true}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText('detail.section_backstory')).toBeInTheDocument();
    expect(screen.getByText('detail.section_personality')).toBeInTheDocument();
    expect(screen.getByText('detail.section_motivation')).toBeInTheDocument();
    expect(screen.getByText('detail.section_bonds')).toBeInTheDocument();
    expect(screen.getByText('detail.section_flaws')).toBeInTheDocument();
    expect(container).toHaveTextContent('Raised by wolves.');
  });

  it('renders nothing when canViewAll is false', () => {
    const { container } = renderWithProviders(
      <CharacterBackgroundSection
        character={fakeCharacter}
        isGm={false}
        canViewAll={false}
        onSaveField={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
