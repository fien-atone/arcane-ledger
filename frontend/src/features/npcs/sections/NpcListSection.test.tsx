/**
 * Tests for NpcListSection — loading / error / empty / list states of the
 * main NpcListPage list card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { NpcListSection } from './NpcListSection';
import { renderWithProviders } from '@/test/helpers';
import type { NPC } from '@/entities/npc';

const npc: NPC = {
  id: 'npc-1',
  campaignId: 'camp-1',
  name: 'Aldric Thorne',
  aliases: [],
  status: 'alive',
  locationPresences: [],
  groupMemberships: [],
  description: '',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function baseProps(
  overrides: Partial<React.ComponentProps<typeof NpcListSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isGm: true,
    partyEnabled: true,
    isLoading: false,
    isError: false,
    npcs: [npc],
    resolveSpeciesName: () => 'Human',
    onToggleVisibility: vi.fn(),
    ...overrides,
  };
}

describe('NpcListSection', () => {
  it('shows empty state when npcs is empty', () => {
    renderWithProviders(<NpcListSection {...baseProps({ npcs: [] })} />);
    expect(screen.getByText('empty_title')).toBeInTheDocument();
  });

  it('renders rows with name and species', () => {
    renderWithProviders(<NpcListSection {...baseProps()} />);
    expect(screen.getByText('Aldric Thorne')).toBeInTheDocument();
    // Species rendered in the lg-visible column
    expect(screen.getAllByText('Human').length).toBeGreaterThan(0);
  });

  it('calls onToggleVisibility when the eye button is clicked (party-gated)', () => {
    const onToggleVisibility = vi.fn();
    renderWithProviders(
      <NpcListSection {...baseProps({ onToggleVisibility })} />,
    );
    fireEvent.click(screen.getByTitle('visible_to_players'));
    expect(onToggleVisibility).toHaveBeenCalledWith(npc);
  });

  it('hides the visibility toggle when party is disabled', () => {
    renderWithProviders(
      <NpcListSection {...baseProps({ partyEnabled: false })} />,
    );
    expect(screen.queryByTitle('visible_to_players')).not.toBeInTheDocument();
  });
});
