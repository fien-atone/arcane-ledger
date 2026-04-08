/**
 * Tests for LocationListSection — loading / error / empty / list states
 * of the main LocationListPage list card.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { LocationListSection } from './LocationListSection';
import { renderWithProviders } from '@/test/helpers';
import type { Location } from '@/entities/location';
import type { LocationTypeEntry } from '@/entities/locationType';

const typeEntry: LocationTypeEntry = {
  id: 'lt-settle',
  name: 'Settlement',
  icon: 'apartment',
  category: 'civilization',
  biomeOptions: [],
  isSettlement: true,
  builtin: true,
  createdAt: '',
};

const typeMap = new Map([['lt-settle', typeEntry]]);
const depthMap = new Map([['loc-1', 0]]);

const loc: Location = {
  id: 'loc-1',
  campaignId: 'camp-1',
  name: 'Ardenhold',
  type: 'lt-settle',
  settlementPopulation: 10000,
  parentLocationId: undefined,
  description: 'Capital city',
  playerVisible: true,
  playerVisibleFields: [],
  createdAt: '2026-01-01',
};

function baseProps(
  overrides: Partial<React.ComponentProps<typeof LocationListSection>> = {},
) {
  return {
    campaignId: 'camp-1',
    isGm: true,
    partyEnabled: true,
    locationTypesEnabled: true,
    isLoading: false,
    isError: false,
    filtered: [loc],
    typeMap,
    depthMap,
    typeFilter: 'all' as const,
    search: '',
    onToggleVisibility: vi.fn(),
    ...overrides,
  };
}

describe('LocationListSection', () => {
  it('shows loading state', () => {
    renderWithProviders(
      <LocationListSection {...baseProps({ isLoading: true, filtered: [] })} />,
    );
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('shows error state', () => {
    renderWithProviders(
      <LocationListSection {...baseProps({ isError: true, filtered: [] })} />,
    );
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('shows empty state when filtered is empty', () => {
    renderWithProviders(<LocationListSection {...baseProps({ filtered: [] })} />);
    expect(screen.getByText('empty_title')).toBeInTheDocument();
  });

  it('renders rows with name and resolved type label', () => {
    renderWithProviders(<LocationListSection {...baseProps()} />);
    expect(screen.getByText('Ardenhold')).toBeInTheDocument();
    expect(screen.getByText('Settlement')).toBeInTheDocument();
  });

  it('calls onToggleVisibility when the eye button is clicked', () => {
    const onToggleVisibility = vi.fn();
    renderWithProviders(
      <LocationListSection {...baseProps({ onToggleVisibility })} />,
    );
    fireEvent.click(screen.getByTitle('visible_to_players'));
    expect(onToggleVisibility).toHaveBeenCalledWith(loc);
  });

  it('hides the visibility toggle when party is disabled', () => {
    renderWithProviders(
      <LocationListSection {...baseProps({ partyEnabled: false })} />,
    );
    expect(screen.queryByTitle('visible_to_players')).not.toBeInTheDocument();
  });
});
