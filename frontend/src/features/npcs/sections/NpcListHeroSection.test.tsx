/**
 * Tests for NpcListHeroSection — presentational header card with title,
 * view switcher, add CTA, search input and status-filter chips.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { NpcListHeroSection } from './NpcListHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { StatusFilterOption } from '../hooks/useNpcListPage';

const statusFilters: StatusFilterOption[] = [
  { value: 'all', label: 'status_all' },
  { value: 'alive', label: 'status_alive' },
  { value: 'dead', label: 'status_dead' },
  { value: 'missing', label: 'status_missing' },
  { value: 'unknown', label: 'status_unknown' },
];

function baseProps(
  overrides: Partial<React.ComponentProps<typeof NpcListHeroSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isGm: true,
    socialGraphEnabled: true,
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all' as const,
    onStatusFilterChange: vi.fn(),
    statusFilters,
    shownCount: 4,
    onAdd: vi.fn(),
    ...overrides,
  };
}

describe('NpcListHeroSection', () => {
  it('renders title, subtitle, GM add button and status filter chips', () => {
    renderWithProviders(<NpcListHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(
      screen.getByText('add_npc', { selector: 'span.font-label' }),
    ).toBeInTheDocument();
    // Chips render the status label (may collide with pills elsewhere, but here
    // the component only renders chip labels, so each status_* appears once).
    expect(screen.getByText('status_all')).toBeInTheDocument();
    expect(screen.getByText('status_alive')).toBeInTheDocument();
    expect(screen.getByText('status_dead')).toBeInTheDocument();
  });

  it('hides add button for non-GM users and hides graph switcher when disabled', () => {
    renderWithProviders(
      <NpcListHeroSection
        {...baseProps({ isGm: false, socialGraphEnabled: false })}
      />,
    );
    expect(
      screen.queryByText('add_npc', { selector: 'span.font-label' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTitle('graph_view')).not.toBeInTheDocument();
    expect(screen.queryByTitle('list_view')).not.toBeInTheDocument();
  });

  it('calls handlers on interaction', () => {
    const onAdd = vi.fn();
    const onSearchChange = vi.fn();
    const onStatusFilterChange = vi.fn();
    renderWithProviders(
      <NpcListHeroSection
        {...baseProps({ onAdd, onSearchChange, onStatusFilterChange })}
      />,
    );

    fireEvent.click(
      screen.getByText('add_npc', { selector: 'span.font-label' }),
    );
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'ald' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('ald');

    fireEvent.click(screen.getByText('status_alive'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('alive');
  });
});
