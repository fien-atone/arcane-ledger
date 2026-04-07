/**
 * Tests for GroupSymbolsSection — public-facing symbols / insignia for a group.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { GroupSymbolsSection } from './GroupSymbolsSection';
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

describe('GroupSymbolsSection', () => {
  it('renders the symbols content for a player', () => {
    renderWithProviders(
      <GroupSymbolsSection
        group={{ ...baseGroup, symbols: '<p>A silver gauntlet on a black field.</p>' }}
        isGm={false}
        onSaveField={() => {}}
      />,
    );
    expect(screen.getByText(/silver gauntlet/)).toBeInTheDocument();
  });

  it('renders the rich-text editor label for the GM', () => {
    renderWithProviders(
      <GroupSymbolsSection group={baseGroup} isGm={true} onSaveField={() => {}} />,
    );
    expect(screen.getByText('section_symbols')).toBeInTheDocument();
  });
});
