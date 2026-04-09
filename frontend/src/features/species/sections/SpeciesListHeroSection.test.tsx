/**
 * Tests for SpeciesListHeroSection — presentational header card with title,
 * add CTA, search input, and type filter chips.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SpeciesListHeroSection } from './SpeciesListHeroSection';
import { renderWithProviders } from '@/test/helpers';

function baseProps(
  overrides: Partial<
    React.ComponentProps<typeof SpeciesListHeroSection>
  > = {},
) {
  return {
    search: '',
    onSearchChange: vi.fn(),
    typeFilter: 'all',
    onTypeFilterChange: vi.fn(),
    typeFilters: [
      { value: 'all', label: 'All' },
      { value: 'st-humanoid', label: 'Humanoid' },
    ],
    shownCount: 3,
    onAdd: vi.fn(),
    ...overrides,
  };
}

describe('SpeciesListHeroSection', () => {
  it('renders title, subtitle, add button and type filter chips', () => {
    renderWithProviders(<SpeciesListHeroSection {...baseProps()} />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('subtitle')).toBeInTheDocument();
    expect(
      screen.getByText('add_species', { selector: 'span.font-label' }),
    ).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Humanoid')).toBeInTheDocument();
  });

  it('hides type filter chips when typeFilters is empty', () => {
    renderWithProviders(
      <SpeciesListHeroSection {...baseProps({ typeFilters: [] })} />,
    );
    expect(screen.queryByText('All')).not.toBeInTheDocument();
  });

  it('calls onAdd, onSearchChange, and onTypeFilterChange handlers', () => {
    const onAdd = vi.fn();
    const onSearchChange = vi.fn();
    const onTypeFilterChange = vi.fn();
    renderWithProviders(
      <SpeciesListHeroSection
        {...baseProps({ onAdd, onSearchChange, onTypeFilterChange })}
      />,
    );

    fireEvent.click(
      screen.getByText('add_species', { selector: 'span.font-label' }),
    );
    expect(onAdd).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByPlaceholderText('search_placeholder'), {
      target: { value: 'elf' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('elf');

    fireEvent.click(screen.getByText('Humanoid'));
    expect(onTypeFilterChange).toHaveBeenCalledWith('st-humanoid');
  });
});
