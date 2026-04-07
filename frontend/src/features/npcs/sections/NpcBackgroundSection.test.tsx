/**
 * Tests for NpcBackgroundSection — renders 4 rich-text panels:
 * background, personality, motivation, flaws.
 *
 * This section is pure presentation — no queries or mutations of its own.
 * The actual rich text editor is InlineRichField, which we don't probe here
 * (it's tested elsewhere). We only verify the section labels render in
 * read-only (player) mode.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NpcBackgroundSection } from './NpcBackgroundSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const fakeNpc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Test',
  aliases: [],
  status: 'alive',
  description: '<p>Born in the woods.</p>',
  personality: '<p>Quiet.</p>',
  motivation: '<p>Find the sword.</p>',
  flaws: '<p>Arrogant.</p>',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  playerVisible: true,
  playerVisibleFields: [],
  locationPresences: [],
  groupMemberships: [],
  relations: [],
};

describe('NpcBackgroundSection', () => {
  it('renders all 4 field labels', () => {
    renderWithProviders(
      <NpcBackgroundSection npc={fakeNpc} isGm={false} onSaveField={() => {}} />,
    );
    // i18n key is returned as-is in tests (see test/helpers.tsx)
    expect(screen.getByText('section_background')).toBeInTheDocument();
    expect(screen.getByText('section_personality')).toBeInTheDocument();
    expect(screen.getByText('section_motivation')).toBeInTheDocument();
    expect(screen.getByText('section_flaws')).toBeInTheDocument();
  });

  it('renders the rich text content', () => {
    const { container } = renderWithProviders(
      <NpcBackgroundSection npc={fakeNpc} isGm={false} onSaveField={() => {}} />,
    );
    // DOMPurify sanitizes the HTML but keeps the text content
    expect(container).toHaveTextContent('Born in the woods.');
    expect(container).toHaveTextContent('Quiet.');
    expect(container).toHaveTextContent('Find the sword.');
    expect(container).toHaveTextContent('Arrogant.');
  });
});
