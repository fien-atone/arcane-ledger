/**
 * Tests for NpcAppearanceSection + NpcGmNotesPanel.
 *
 * Appearance section is always visible (editable by GM, read-only for players).
 * GM notes panel only renders when viewer is GM.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { NpcAppearanceSection, NpcGmNotesPanel } from './NpcAppearanceSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const fakeNpc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Test',
  aliases: [],
  status: 'alive',
  appearance: '<p>Tall and pale.</p>',
  gmNotes: '<p>Secret lineage.</p>',
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  playerVisible: true,
  playerVisibleFields: [],
  locationPresences: [],
  groupMemberships: [],
  relations: [],
};

describe('NpcAppearanceSection', () => {
  it('renders the appearance label and content for GM', () => {
    const { container } = renderWithProviders(
      <NpcAppearanceSection npc={fakeNpc} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_appearance')).toBeInTheDocument();
    expect(container).toHaveTextContent('Tall and pale.');
  });

  it('renders the appearance label and content for players (read-only)', () => {
    const { container } = renderWithProviders(
      <NpcAppearanceSection npc={fakeNpc} isGm={false} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_appearance')).toBeInTheDocument();
    expect(container).toHaveTextContent('Tall and pale.');
  });
});

describe('NpcGmNotesPanel', () => {
  it('renders GM notes content when viewer is GM', () => {
    const { container } = renderWithProviders(
      <NpcGmNotesPanel npc={fakeNpc} isGm={true} onSaveField={() => {}} />,
    );
    expect(container).toHaveTextContent('Secret lineage.');
  });

  it('renders nothing for non-GM viewers', () => {
    const { container } = renderWithProviders(
      <NpcGmNotesPanel npc={fakeNpc} isGm={false} onSaveField={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
