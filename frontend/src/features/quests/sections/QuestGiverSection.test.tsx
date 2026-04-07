/**
 * Tests for QuestGiverSection — linked NPC giver summary card.
 *
 * Gated on the NPCs module flag. Shows an empty-state message when no
 * giver is linked, and a linked NPC card when one exists.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QuestGiverSection } from './QuestGiverSection';
import { renderWithProviders } from '@/test/helpers';
import type { Quest } from '@/entities/quest';

const baseQuest: Quest = {
  id: 'q-1',
  campaignId: 'camp-1',
  title: 'Recover the Amulet',
  description: '',
  status: 'active',
  notes: '',
  createdAt: '2026-01-01',
};

describe('QuestGiverSection', () => {
  it('renders nothing when the NPCs module is disabled', () => {
    const { container } = renderWithProviders(
      <QuestGiverSection campaignId="camp-1" quest={baseQuest} npcsEnabled={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the empty-state message when no giver is linked', () => {
    renderWithProviders(
      <QuestGiverSection campaignId="camp-1" quest={baseQuest} npcsEnabled={true} />,
    );
    expect(screen.getByText('section_quest_giver')).toBeInTheDocument();
    expect(screen.getByText('no_quest_giver')).toBeInTheDocument();
  });

  it('renders the giver name when a giver is linked', () => {
    const questWithGiver: Quest = {
      ...baseQuest,
      giver: { id: 'npc-1', name: 'Elrond Half-elven', species: 'Elf' },
    };
    renderWithProviders(
      <QuestGiverSection campaignId="camp-1" quest={questWithGiver} npcsEnabled={true} />,
    );
    expect(screen.getByText('Elrond Half-elven')).toBeInTheDocument();
    expect(screen.getByText('Elf')).toBeInTheDocument();
  });
});
