/**
 * Tests for AdminUsersListSection — verifies the loading state, the empty
 * state, and the rendered table rows with inline edit / delete actions
 * plus the inline Yes/No confirm flow.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { AdminUsersListSection } from './AdminUsersListSection';
import { renderWithProviders } from '@/test/helpers';
import type { User } from '@/entities/user';

const users: User[] = [
  {
    id: 'u-1',
    email: 'gm@arcaneledger.app',
    name: 'Game Master',
    role: 'admin',
    createdAt: '2026-01-01',
  },
  {
    id: 'u-2',
    email: 'player@arcaneledger.app',
    name: 'Player One',
    role: 'user',
    createdAt: '2026-01-02',
  },
];

function baseProps(overrides: Partial<React.ComponentProps<typeof AdminUsersListSection>> = {}) {
  return {
    users,
    isLoading: false,
    search: '',
    onSearchChange: vi.fn(),
    debouncedSearch: '',
    confirmDeleteId: null as string | null,
    onEdit: vi.fn(),
    onRequestDelete: vi.fn(),
    onCancelDelete: vi.fn(),
    onConfirmDelete: vi.fn(),
    ...overrides,
  };
}

describe('AdminUsersListSection', () => {
  it('renders loading state when isLoading is true', () => {
    renderWithProviders(
      <AdminUsersListSection {...baseProps({ users: undefined, isLoading: true })} />,
    );
    expect(screen.getByText('loading_users')).toBeInTheDocument();
  });

  it('renders empty state when there are no users', () => {
    renderWithProviders(
      <AdminUsersListSection {...baseProps({ users: [] })} />,
    );
    expect(screen.getByText('no_users')).toBeInTheDocument();
  });

  it('renders each user row with its name, email, and role label', () => {
    renderWithProviders(<AdminUsersListSection {...baseProps()} />);
    expect(screen.getByText('Game Master')).toBeInTheDocument();
    expect(screen.getByText('gm@arcaneledger.app')).toBeInTheDocument();
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('player@arcaneledger.app')).toBeInTheDocument();
    expect(screen.getByText('roles.admin')).toBeInTheDocument();
    expect(screen.getByText('roles.user')).toBeInTheDocument();
  });

  it('shows inline Yes/No confirm when a row is flagged for delete', () => {
    const onConfirmDelete = vi.fn();
    const onCancelDelete = vi.fn();
    renderWithProviders(
      <AdminUsersListSection
        {...baseProps({
          confirmDeleteId: 'u-2',
          onConfirmDelete,
          onCancelDelete,
        })}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'confirm_yes' }));
    expect(onConfirmDelete).toHaveBeenCalledWith('u-2');
    fireEvent.click(screen.getByRole('button', { name: 'confirm_no' }));
    expect(onCancelDelete).toHaveBeenCalledTimes(1);
  });
});
