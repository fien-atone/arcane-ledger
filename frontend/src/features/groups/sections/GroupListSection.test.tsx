/**
 * Tests for GroupListSection — loading / error / empty / list states of
 * the main GroupListPage list card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { GroupListSection } from './GroupListSection';
import { renderWithProviders } from '@/test/helpers';
import type { Group } from '@/entities/group';

const group: Group = {
  id: 'g-1',
  campaignId: 'camp-1',
  name: 'Iron Order',
  type: 'gt-guild',
  aliases: [],
  description: '',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

function baseProps(
  overrides: Partial<React.ComponentProps<typeof GroupListSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isGm: true,
    groupTypesEnabled: true,
    partyEnabled: true,
    isLoading: false,
    isError: false,
    filtered: [group],
    resolveType: () => ({ name: 'Guild', icon: 'handshake' }),
    onToggleVisibility: vi.fn(),
    ...overrides,
  };
}

describe('GroupListSection', () => {
  it('shows empty state when filtered is empty', () => {
    renderWithProviders(<GroupListSection {...baseProps({ filtered: [] })} />);
    expect(screen.getByText('empty_title')).toBeInTheDocument();
  });

  it('renders rows with name and type name', () => {
    renderWithProviders(<GroupListSection {...baseProps()} />);
    expect(screen.getByText('Iron Order')).toBeInTheDocument();
    // Type name rendered in the lg-visible column (and possibly the mobile
    // subtitle) — we just assert at least one appears.
    expect(screen.getAllByText('Guild').length).toBeGreaterThan(0);
  });

  it('calls onToggleVisibility when the eye button is clicked (party-gated)', () => {
    const onToggleVisibility = vi.fn();
    renderWithProviders(
      <GroupListSection {...baseProps({ onToggleVisibility })} />,
    );
    fireEvent.click(screen.getByTitle('visible_to_players'));
    expect(onToggleVisibility).toHaveBeenCalledWith(group);
  });

  it('hides the visibility toggle when party is disabled', () => {
    renderWithProviders(
      <GroupListSection {...baseProps({ partyEnabled: false })} />,
    );
    expect(screen.queryByTitle('visible_to_players')).not.toBeInTheDocument();
  });
});
