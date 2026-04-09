/**
 * Tests for GroupListHeroSection — presentational header card with title,
 * add CTA, search input and type-filter chips.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { GroupListHeroSection } from './GroupListHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { TypeFilterOption } from '../hooks/useGroupListPage';

const typeFilters: TypeFilterOption[] = [
  { value: 'all', label: 'filter_all' },
  { value: 'gt-guild', label: 'Guild' },
  { value: 'gt-cult', label: 'Cult' },
];

function baseProps(
  overrides: Partial<React.ComponentProps<typeof GroupListHeroSection>> = {},
) {
  return {
    isGm: true,
    search: '',
    onSearchChange: vi.fn(),
    typeFilter: 'all',
    onTypeFilterChange: vi.fn(),
    typeFilters,
    shownCount: 3,
    onAdd: vi.fn(),
    ...overrides,
  };
}

describe('GroupListHeroSection', () => {
  it('renders title, subtitle, GM add button and type filter chips', () => {
    renderWithProviders(<GroupListHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(
      screen.getByText('add_group', { selector: 'span.font-label' }),
    ).toBeInTheDocument();
    expect(screen.getByText('filter_all')).toBeInTheDocument();
    expect(screen.getByText('Guild')).toBeInTheDocument();
    expect(screen.getByText('Cult')).toBeInTheDocument();
  });

  it('hides add button for non-GM users and hides chips when empty', () => {
    renderWithProviders(
      <GroupListHeroSection
        {...baseProps({ isGm: false, typeFilters: [] })}
      />,
    );
    expect(
      screen.queryByText('add_group', { selector: 'span.font-label' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('filter_all')).not.toBeInTheDocument();
  });

  it('calls handlers on interaction', () => {
    const onAdd = vi.fn();
    const onSearchChange = vi.fn();
    const onTypeFilterChange = vi.fn();
    renderWithProviders(
      <GroupListHeroSection
        {...baseProps({ onAdd, onSearchChange, onTypeFilterChange })}
      />,
    );

    fireEvent.click(
      screen.getByText('add_group', { selector: 'span.font-label' }),
    );
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'iron' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('iron');

    fireEvent.click(screen.getByText('Guild'));
    expect(onTypeFilterChange).toHaveBeenCalledWith('gt-guild');
  });
});
