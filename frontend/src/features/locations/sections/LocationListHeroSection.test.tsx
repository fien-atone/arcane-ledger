/**
 * Tests for LocationListHeroSection — presentational header card with
 * title, add CTA, search input and type-filter chips.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { LocationListHeroSection } from './LocationListHeroSection';
import { renderWithProviders } from '@/test/helpers';
import type { TypeFilterOption } from '../hooks/useLocationListPage';

const typeFilters: TypeFilterOption[] = [
  { value: 'all', label: 'filter_all' },
  { value: 'lt-world', label: 'Continent' },
  { value: 'lt-region', label: 'Region' },
];

function baseProps(overrides: Partial<React.ComponentProps<typeof LocationListHeroSection>> = {}) {
  return {
    isGm: true,
    locationTypesEnabled: true,
    search: '',
    onSearchChange: vi.fn(),
    typeFilter: 'all' as const,
    onTypeFilterChange: vi.fn(),
    typeFilters,
    shownCount: 5,
    onAdd: vi.fn(),
    ...overrides,
  };
}

describe('LocationListHeroSection', () => {
  it('renders title, subtitle and GM add button', () => {
    renderWithProviders(<LocationListHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    // The icon glyph and the i18n label both read "add_location", so match the
    // label span specifically (it has the font-label class).
    expect(
      screen.getByText('add_location', { selector: 'span.font-label' }),
    ).toBeInTheDocument();
  });

  it('hides add button for non-GM users', () => {
    renderWithProviders(
      <LocationListHeroSection {...baseProps({ isGm: false })} />,
    );
    expect(
      screen.queryByText('add_location', { selector: 'span.font-label' }),
    ).not.toBeInTheDocument();
  });

  it('renders type filter chips with counts when enabled', () => {
    renderWithProviders(<LocationListHeroSection {...baseProps()} />);
    expect(screen.getByText('filter_all')).toBeInTheDocument();
    expect(screen.getByText('Continent')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
  });

  it('hides type filter chips when locationTypesEnabled is false', () => {
    renderWithProviders(
      <LocationListHeroSection
        {...baseProps({ locationTypesEnabled: false })}
      />,
    );
    expect(screen.queryByText('Continent')).not.toBeInTheDocument();
  });

  it('calls handlers on interaction', () => {
    const onAdd = vi.fn();
    const onSearchChange = vi.fn();
    const onTypeFilterChange = vi.fn();
    renderWithProviders(
      <LocationListHeroSection
        {...baseProps({ onAdd, onSearchChange, onTypeFilterChange })}
      />,
    );

    fireEvent.click(
      screen.getByText('add_location', { selector: 'span.font-label' }),
    );
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'ard' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('ard');

    fireEvent.click(screen.getByText('Region'));
    expect(onTypeFilterChange).toHaveBeenCalledWith('lt-region');
  });
});
