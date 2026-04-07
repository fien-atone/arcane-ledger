/**
 * Tests for QuestRewardSection — reward rich-text field under a labeled header.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { QuestRewardSection } from './QuestRewardSection';
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

describe('QuestRewardSection', () => {
  it('renders the section header', () => {
    renderWithProviders(
      <QuestRewardSection quest={baseQuest} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_reward')).toBeInTheDocument();
  });

  it('renders the reward content for a player', () => {
    renderWithProviders(
      <QuestRewardSection
        quest={{ ...baseQuest, reward: '<p>500 gold pieces.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/500 gold pieces/)).toBeInTheDocument();
  });
});
