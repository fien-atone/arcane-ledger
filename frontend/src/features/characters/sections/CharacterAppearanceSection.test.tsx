/**
 * Tests for CharacterAppearanceSection.
 * Always visible; GM can edit, players see read-only.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CharacterAppearanceSection } from './CharacterAppearanceSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const fakeCharacter: PlayerCharacter = {
  id: 'char-1',
  campaignId: 'camp-1',
  name: 'Test',
  appearance: '<p>Tall and blonde.</p>',
  gmNotes: '',
  groupMemberships: [],
  createdAt: '2026-01-01',
};

describe('CharacterAppearanceSection', () => {
  it('renders the appearance label and content for GM', () => {
    const { container } = renderWithProviders(
      <CharacterAppearanceSection character={fakeCharacter} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('detail.section_appearance')).toBeInTheDocument();
    expect(container).toHaveTextContent('Tall and blonde.');
  });

  it('renders the appearance label and content for players (read-only)', () => {
    const { container } = renderWithProviders(
      <CharacterAppearanceSection character={fakeCharacter} isGm={false} onSaveField={() => {}} />,
    );
    expect(screen.getByText('detail.section_appearance')).toBeInTheDocument();
    expect(container).toHaveTextContent('Tall and blonde.');
  });
});
