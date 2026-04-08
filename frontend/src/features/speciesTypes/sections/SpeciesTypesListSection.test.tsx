/**
 * Tests for SpeciesTypesListSection — left-column searchable list.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SpeciesTypesListSection } from './SpeciesTypesListSection';
import { renderWithProviders } from '@/test/helpers';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

const types: SpeciesTypeEntry[] = [
  { id: 'st-1', campaignId: 'c-1', name: 'Humanoid', icon: 'person', createdAt: '' },
  { id: 'st-2', campaignId: 'c-1', name: 'Beast',    icon: 'pets',   createdAt: '' },
  { id: 'st-3', campaignId: 'c-1', name: 'Undead',   icon: 'skull',  createdAt: '' },
];

describe('SpeciesTypesListSection', () => {
  it('renders rows and the total count', () => {
    renderWithProviders(
      <SpeciesTypesListSection
        types={types}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('Humanoid')).toBeInTheDocument();
    expect(screen.getByText('Beast')).toBeInTheDocument();
    expect(screen.getByText('Undead')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty state when the list is empty', () => {
    renderWithProviders(
      <SpeciesTypesListSection
        types={[]}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('types_empty_title')).toBeInTheDocument();
  });

  it('reports selection via onSelect when a row is clicked', () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <SpeciesTypesListSection
        types={types}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText('Undead'));
    expect(onSelect).toHaveBeenCalledWith('st-3');
  });
});
