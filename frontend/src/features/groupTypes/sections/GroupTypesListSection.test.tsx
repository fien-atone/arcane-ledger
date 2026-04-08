/**
 * Tests for GroupTypesListSection — left-column searchable list.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { GroupTypesListSection } from './GroupTypesListSection';
import { renderWithProviders } from '@/test/helpers';
import type { GroupTypeEntry } from '@/entities/groupType';

const types: GroupTypeEntry[] = [
  { id: 'gt-1', campaignId: 'c-1', name: 'Faction', icon: 'shield',   createdAt: '' },
  { id: 'gt-2', campaignId: 'c-1', name: 'Guild',   icon: 'handshake', createdAt: '' },
  { id: 'gt-3', campaignId: 'c-1', name: 'Cult',    icon: 'local_fire_department', createdAt: '' },
];

describe('GroupTypesListSection', () => {
  it('renders rows and the total count', () => {
    renderWithProviders(
      <GroupTypesListSection
        types={types}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('Faction')).toBeInTheDocument();
    expect(screen.getByText('Guild')).toBeInTheDocument();
    expect(screen.getByText('Cult')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows empty state when the list is empty', () => {
    renderWithProviders(
      <GroupTypesListSection
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
      <GroupTypesListSection
        types={types}
        search=""
        onSearchChange={() => {}}
        selectedId={null}
        showNew={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText('Cult'));
    expect(onSelect).toHaveBeenCalledWith('gt-3');
  });
});
