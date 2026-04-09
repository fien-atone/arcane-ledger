/**
 * Tests for SpeciesTypeDetailSection — right-column detail view for a
 * selected species type. Verifies header rendering, edit button callback
 * and inline delete-confirm flow.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { SpeciesTypeDetailSection } from './SpeciesTypeDetailSection';
import { renderWithProviders } from '@/test/helpers';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

const entry: SpeciesTypeEntry = {
  id: 'st-1',
  campaignId: 'c-1',
  name: 'Humanoid',
  icon: 'person',
  description: undefined,
  createdAt: '',
};

describe('SpeciesTypeDetailSection', () => {
  it('renders the entry name and top-bar actions', () => {
    renderWithProviders(
      <SpeciesTypeDetailSection
        campaignId="c-1"
        entry={entry}
        onEdit={() => {}}
        onDeleted={() => {}}
      />,
    );
    expect(screen.getByText('Humanoid')).toBeInTheDocument();
    expect(screen.getByText('types_edit')).toBeInTheDocument();
    expect(screen.getByText('types_delete')).toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', () => {
    const onEdit = vi.fn();
    renderWithProviders(
      <SpeciesTypeDetailSection
        campaignId="c-1"
        entry={entry}
        onEdit={onEdit}
        onDeleted={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('types_edit'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('shows inline confirm when delete is clicked and cancels on no', () => {
    renderWithProviders(
      <SpeciesTypeDetailSection
        campaignId="c-1"
        entry={entry}
        onEdit={() => {}}
        onDeleted={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('types_delete'));
    expect(screen.getByText('types_delete_confirm')).toBeInTheDocument();
    // InlineConfirm renders 'yes'/'no' keys via the common namespace.
    expect(screen.getByRole('button', { name: 'yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'no' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'no' }));
    expect(screen.queryByText('types_delete_confirm')).not.toBeInTheDocument();
  });
});
