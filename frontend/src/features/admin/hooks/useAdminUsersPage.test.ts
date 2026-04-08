/**
 * Tests for useAdminUsersPage — covers the debounced search toggle,
 * drawer open/close state for create vs edit, and the delete confirm
 * request/cancel/confirm cycle.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { gql } from '@apollo/client';
import { useAdminUsersPage } from './useAdminUsersPage';
import { renderHookWithProviders } from '@/test/helpers';
import type { User } from '@/entities/user';

const ADMIN_USERS = gql`
  query AdminUsers($search: String) {
    adminUsers(search: $search) {
      id
      email
      name
      avatar
      role
      createdAt
    }
  }
`;

const USERS_CHANGED_SUBSCRIPTION = gql`
  subscription UsersChanged {
    usersChanged
  }
`;

const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id)
  }
`;

const usersMock = {
  request: { query: ADMIN_USERS, variables: { search: undefined } },
  result: {
    data: {
      adminUsers: [
        {
          id: 'u-1',
          email: 'gm@arcaneledger.app',
          name: 'Game Master',
          avatar: null,
          role: 'ADMIN',
          createdAt: '2026-01-01',
        },
      ],
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const subMock = {
  request: { query: USERS_CHANGED_SUBSCRIPTION },
  result: { data: { usersChanged: null } },
};

const deleteMock = {
  request: { query: ADMIN_DELETE_USER, variables: { id: 'u-1' } },
  result: { data: { adminDeleteUser: true } },
};

const sampleUser: User = {
  id: 'u-2',
  email: 'player@arcaneledger.app',
  name: 'Player One',
  role: 'user',
  createdAt: '2026-01-02',
};

describe('useAdminUsersPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search and toggles drawer state for create vs edit', async () => {
    const { result } = renderHookWithProviders(() => useAdminUsersPage(), {
      mocks: [usersMock, subMock],
    });

    // debounced search starts empty and updates after 300ms
    expect(result.current.debouncedSearch).toBe('');
    act(() => result.current.setSearch('alice'));
    expect(result.current.search).toBe('alice');
    expect(result.current.debouncedSearch).toBe('');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.debouncedSearch).toBe('alice');

    // openCreate → drawer open, no editing user
    act(() => result.current.openCreate());
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.editingUser).toBeUndefined();

    // openEdit → drawer open with editing user
    act(() => result.current.openEdit(sampleUser));
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.editingUser).toBe(sampleUser);

    // closeDrawer clears everything
    act(() => result.current.closeDrawer());
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.editingUser).toBeUndefined();
  });

  it('request/cancel/confirm delete cycle updates confirmDeleteId', async () => {
    vi.useRealTimers();
    const { result } = renderHookWithProviders(() => useAdminUsersPage(), {
      mocks: [usersMock, subMock, deleteMock, usersMock],
    });

    await waitFor(() => expect(result.current.users).toBeDefined());

    expect(result.current.confirmDeleteId).toBeNull();
    act(() => result.current.requestDelete('u-1'));
    expect(result.current.confirmDeleteId).toBe('u-1');
    act(() => result.current.cancelDelete());
    expect(result.current.confirmDeleteId).toBeNull();

    act(() => result.current.requestDelete('u-1'));
    await act(async () => {
      await result.current.confirmDelete('u-1');
    });
    expect(result.current.confirmDeleteId).toBeNull();
  });
});
