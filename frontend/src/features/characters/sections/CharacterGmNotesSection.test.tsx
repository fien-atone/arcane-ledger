/**
 * Tests for CharacterGmNotesSection.
 * Visible only to GM; renders nothing for players.
 */
import { describe, it, expect } from 'vitest';
import { CharacterGmNotesSection } from './CharacterGmNotesSection';
import { renderWithProviders } from '@/test/helpers';
import type { PlayerCharacter } from '@/entities/character';

const fakeCharacter: PlayerCharacter = {
  id: 'char-1',
  campaignId: 'camp-1',
  name: 'Test',
  gmNotes: '<p>Secret lineage.</p>',
  groupMemberships: [],
  createdAt: '2026-01-01',
};

describe('CharacterGmNotesSection', () => {
  it('renders GM notes content when viewer is GM', () => {
    const { container } = renderWithProviders(
      <CharacterGmNotesSection character={fakeCharacter} isGm={true} onSaveField={() => {}} />,
    );
    // InlineRichField with isGmNotes renders its own hardcoded 'gm_notes'
    // heading, so we only assert on the content being rendered.
    expect(container).toHaveTextContent('Secret lineage.');
  });

  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <CharacterGmNotesSection character={fakeCharacter} isGm={false} onSaveField={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
