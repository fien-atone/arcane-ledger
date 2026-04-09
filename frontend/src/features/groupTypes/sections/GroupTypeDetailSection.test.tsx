/**
 * Tests for GroupTypeDetailSection — right-column detail view for a
 * selected group type. Verifies header rendering, edit callback and the
 * inline delete-confirm flow.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { GroupTypeDetailSection } from './GroupTypeDetailSection';
import { renderWithProviders } from '@/test/helpers';
import type { GroupTypeEntry } from '@/entities/groupType';

const entry: GroupTypeEntry = {
  id: 'gt-1',
  campaignId: 'c-1',
  name: 'Faction',
  icon: 'shield',
  description: undefined,
  createdAt: '',
};

describe('GroupTypeDetailSection', () => {
  it('renders the entry name and edit action', () => {
    renderWithProviders(
      <GroupTypeDetailSection
        campaignId="c-1"
        entry={entry}
        onEdit={() => {}}
        onDeleted={() => {}}
      />,
    );
    expect(screen.getByText('Faction')).toBeInTheDocument();
    expect(screen.getByText('types_edit')).toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', () => {
    const onEdit = vi.fn();
    renderWithProviders(
      <GroupTypeDetailSection
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
      <GroupTypeDetailSection
        campaignId="c-1"
        entry={entry}
        onEdit={() => {}}
        onDeleted={() => {}}
      />,
    );
    // Icon-only delete button — query by the delete material icon text
    fireEvent.click(screen.getByText('delete'));
    expect(screen.getByText('types_delete_confirm')).toBeInTheDocument();
    // InlineConfirm renders 'yes'/'no' keys via the common namespace.
    expect(screen.getByRole('button', { name: 'yes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'no' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'no' }));
    expect(screen.queryByText('types_delete_confirm')).not.toBeInTheDocument();
  });
});
