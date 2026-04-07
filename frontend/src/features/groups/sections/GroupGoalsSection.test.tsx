/**
 * Tests for GroupGoalsSection — public-facing goals for a group.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { GroupGoalsSection } from './GroupGoalsSection';
import { renderWithProviders } from '@/test/helpers';
import type { Group } from '@/entities/group';

const baseGroup: Group = {
  id: 'g-1',
  campaignId: 'camp-1',
  name: 'The Silver Hand',
  type: 'faction',
  aliases: [],
  description: '',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

describe('GroupGoalsSection', () => {
  it('renders the goals content for a player', () => {
    renderWithProviders(
      <GroupGoalsSection
        group={{ ...baseGroup, goals: '<p>Restore the lost king.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/Restore the lost king/)).toBeInTheDocument();
  });

  it('renders the rich-text editor label for the GM', () => {
    renderWithProviders(
      <GroupGoalsSection group={baseGroup} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_goals')).toBeInTheDocument();
  });
});
