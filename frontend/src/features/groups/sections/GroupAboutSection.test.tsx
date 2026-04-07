/**
 * Tests for GroupAboutSection — public-facing description for a group.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { GroupAboutSection } from './GroupAboutSection';
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

describe('GroupAboutSection', () => {
  it('renders the description content for a player', () => {
    renderWithProviders(
      <GroupAboutSection
        group={{ ...baseGroup, description: '<p>An ancient order of knights.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/ancient order of knights/)).toBeInTheDocument();
  });

  it('renders the rich-text editor label for the GM', () => {
    renderWithProviders(
      <GroupAboutSection group={baseGroup} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_about')).toBeInTheDocument();
  });
});
