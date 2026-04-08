/**
 * Tests for LocationTypesListSection — left-column searchable list.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { LocationTypesListSection } from './LocationTypesListSection';
import { renderWithProviders } from '@/test/helpers';
import type { LocationTypeEntry } from '@/entities/locationType';

const types: LocationTypeEntry[] = [
  { id: 'lt-1', name: 'Continent',  icon: 'public',    category: 'world',        biomeOptions: [], isSettlement: false, builtin: true,  createdAt: '' },
  { id: 'lt-2', name: 'Settlement', icon: 'apartment', category: 'civilization', biomeOptions: [], isSettlement: true,  builtin: true,  createdAt: '' },
  { id: 'lt-3', name: 'Region',     icon: 'terrain',   category: 'geographic',   biomeOptions: [], isSettlement: false, builtin: false, createdAt: '' },
];

describe('LocationTypesListSection', () => {
  it('renders the list grouped by category and reports the total count', () => {
    renderWithProviders(
      <LocationTypesListSection
        filtered={types}
        totalCount={types.length}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('Continent')).toBeInTheDocument();
    expect(screen.getByText('Settlement')).toBeInTheDocument();
    expect(screen.getByText('Region')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty state when filtered list is empty', () => {
    renderWithProviders(
      <LocationTypesListSection
        filtered={[]}
        totalCount={0}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('types_empty')).toBeInTheDocument();
  });

  it('reports selection via onSelect when a row is clicked', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <LocationTypesListSection
        filtered={types}
        totalCount={types.length}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText('Region'));
    expect(onSelect).toHaveBeenCalledWith('lt-3');
  });
});
