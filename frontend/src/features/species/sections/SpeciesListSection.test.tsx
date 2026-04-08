/**
 * Tests for SpeciesListSection — loading / error / empty / list states of
 * the SpeciesPage main list card.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { SpeciesListSection } from './SpeciesListSection';
import { renderWithProviders } from '@/test/helpers';
import type { Species } from '@/entities/species';

const species: Species = {
  id: 's-1',
  campaignId: 'camp-1',
  name: 'Elf',
  pluralName: 'Elves',
  type: 'st-humanoid',
  size: 'medium',
  description: '',
  traits: [],
  createdAt: '2026-01-01',
};

function baseProps(
  overrides: Partial<React.ComponentProps<typeof SpeciesListSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isLoading: false,
    isError: false,
    filtered: [species],
    typesEnabled: true,
    resolveTypeName: (id: string) => (id === 'st-humanoid' ? 'Humanoid' : id),
    ...overrides,
  };
}

describe('SpeciesListSection', () => {
  it('shows loading state', () => {
    renderWithProviders(
      <SpeciesListSection {...baseProps({ isLoading: true })} />,
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('shows empty state when filtered is empty', () => {
    renderWithProviders(
      <SpeciesListSection {...baseProps({ filtered: [] })} />,
    );
    expect(screen.getByText('empty_title')).toBeInTheDocument();
  });

  it('renders rows with name, resolved type and size label', () => {
    renderWithProviders(<SpeciesListSection {...baseProps()} />);
    expect(screen.getByText('Elf')).toBeInTheDocument();
    // 'Humanoid' shown in both desktop column and mobile subtitle
    expect(screen.getAllByText('Humanoid').length).toBeGreaterThan(0);
    // size resolved via t('size_medium')
    expect(screen.getAllByText('size_medium').length).toBeGreaterThan(0);
  });

  it('hides the type column value when typesEnabled is false', () => {
    renderWithProviders(
      <SpeciesListSection {...baseProps({ typesEnabled: false })} />,
    );
    expect(screen.getByText('Elf')).toBeInTheDocument();
    // type name should not appear
    expect(screen.queryByText('Humanoid')).not.toBeInTheDocument();
  });
});
