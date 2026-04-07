/**
 * Tests for QuestDescriptionSection — public-facing description for a quest.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QuestDescriptionSection } from './QuestDescriptionSection';
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

describe('QuestDescriptionSection', () => {
  it('renders the description content for a player', () => {
    renderWithProviders(
      <QuestDescriptionSection
        quest={{ ...baseQuest, description: '<p>Travel to the ancient temple.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/ancient temple/)).toBeInTheDocument();
  });

  it('renders the rich-text editor label for the GM', () => {
    renderWithProviders(
      <QuestDescriptionSection quest={baseQuest} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_description')).toBeInTheDocument();
  });
});
