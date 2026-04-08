/**
 * Page-level state for AdminUsersPage — the admin-only user management page.
 *
 * Owns:
 * - search input + debounced search (300ms)
 * - edit/create drawer open state and the user being edited
 * - delete confirmation state (inline Yes/No, not a modal)
 * - the users list fetch + delete mutation
 *
 * Section widgets (hero + list) receive state + handlers via props; the hook
 * is the single source of truth for the page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminUsers, useDeleteUser } from '@/features/admin/api/queries';
import type { User } from '@/entities/user';

export interface UseAdminUsersPageResult {
  // data
  users: User[] | undefined;
  isLoading: boolean;
  // search
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
  // drawer
  drawerOpen: boolean;
  editingUser: User | undefined;
  openCreate: () => void;
  openEdit: (user: User) => void;
  closeDrawer: () => void;
  // delete confirm
  confirmDeleteId: string | null;
  requestDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: (id: string) => Promise<void>;
}

export function useAdminUsersPage(): UseAdminUsersPageResult {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: users, isLoading } = useAdminUsers(debouncedSearch || undefined);
  const deleteUser = useDeleteUser();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Debounce search (300ms) — mirrors the original AdminUsersPage behavior.
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const openCreate = useCallback(() => {
    setEditingUser(undefined);
    setDrawerOpen(true);
  }, []);

  const openEdit = useCallback((user: User) => {
    setEditingUser(user);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingUser(undefined);
  }, []);

  const requestDelete = useCallback((id: string) => {
    setConfirmDeleteId(id);
  }, []);

  const cancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const confirmDelete = useCallback(
    async (id: string) => {
      try {
        await deleteUser.mutate(id);
      } catch {
        // handled by Apollo error link
      }
      setConfirmDeleteId(null);
    },
    [deleteUser],
  );

  return {
    users,
    isLoading,
    search,
    setSearch,
    debouncedSearch,
    drawerOpen,
    editingUser,
    openCreate,
    openEdit,
    closeDrawer,
    confirmDeleteId,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
