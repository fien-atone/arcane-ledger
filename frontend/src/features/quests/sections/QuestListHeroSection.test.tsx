/**
 * Tests for QuestListHeroSection — presentational header card with title,
 * add CTA, search input and status-filter chips.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { QuestListHeroSection } from './QuestListHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { StatusFilterOption } from '../hooks/useQuestListPage';

const statusFilters: StatusFilterOption[] = [
  { value: 'all', label: 'filter_all', count: 3 },
  { value: 'active', label: 'status_active', count: 2 },
  { value: 'undiscovered', label: 'status_undiscovered', count: 0 },
  { value: 'completed', label: 'status_completed', count: 1 },
  { value: 'unavailable', label: 'status_unavailable', count: 0 },
  { value: 'failed', label: 'status_failed', count: 0 },
];

function baseProps(
  overrides: Partial<
    React.ComponentProps<typeof QuestListHeroSection>
  > = {},
) {
  return {
    isGm: true,
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all' as const,
    onStatusFilterChange: vi.fn(),
    statusFilters,
    filteredCount: 3,
    totalCount: 3,
    onAdd: vi.fn(),
    ...overrides,
  };
}

describe('QuestListHeroSection', () => {
  it('renders title, subtitle, GM add button and status filter chips', () => {
    renderWithProviders(<QuestListHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(
      screen.getByText('new_quest', { selector: 'span.font-label' }),
    ).toBeInTheDocument();
    expect(screen.getByText('filter_all')).toBeInTheDocument();
    expect(screen.getByText('status_active')).toBeInTheDocument();
    expect(screen.getByText('status_completed')).toBeInTheDocument();
  });

  it('hides add button for non-GM users', () => {
    renderWithProviders(
      <QuestListHeroSection {...baseProps({ isGm: false })} />,
    );
    expect(
      screen.queryByText('new_quest', { selector: 'span.font-label' }),
    ).not.toBeInTheDocument();
  });

  it('calls handlers on interaction', () => {
    const onAdd = vi.fn();
    const onSearchChange = vi.fn();
    const onStatusFilterChange = vi.fn();
    renderWithProviders(
      <QuestListHeroSection
        {...baseProps({ onAdd, onSearchChange, onStatusFilterChange })}
      />,
    );

    fireEvent.click(
      screen.getByText('new_quest', { selector: 'span.font-label' }),
    );
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'dragon' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('dragon');

    fireEvent.click(screen.getByText('status_active'));
    expect(onStatusFilterChange).toHaveBeenCalledWith('active');
  });
});
