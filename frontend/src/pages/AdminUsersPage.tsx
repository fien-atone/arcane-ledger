import { useState, useCallback, useRef, useEffect } from 'react';
import { SectionBackground } from '@/shared/ui';
import { useAdminUsers, useDeleteUser } from '@/features/admin/api/queries';
import { AdminUserDrawer } from '@/features/admin/ui/AdminUserDrawer';
import { useAuthStore } from '@/features/auth';
import type { User } from '@/entities/user';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: users, isLoading } = useAdminUsers(debouncedSearch || undefined);
  const deleteUser = useDeleteUser();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const handleCreate = useCallback(() => {
    setEditingUser(undefined);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setDrawerOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteUser.mutate(id);
    } catch {
      // handled by Apollo
    }
    setConfirmDeleteId(null);
  }, [deleteUser]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingUser(undefined);
  }, []);

  return (
    <>
    <SectionBackground />
    <div className="max-w-5xl mx-auto px-8 py-10 relative z-10">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '32px' }}
          >
            admin_panel_settings
          </span>
          <div>
            <h1 className="font-headline text-2xl font-bold text-on-surface">
              User Management
            </h1>
            <p className="text-xs text-on-surface-variant/60 uppercase tracking-widest mt-0.5">
              System administration
            </p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Create User
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <label className={labelCls}>Search Users</label>
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 pl-10 pr-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
          />
        </div>
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-primary mr-3">progress_activity</span>
          <span className="text-on-surface-variant text-sm">Loading users...</span>
        </div>
      ) : !users || users.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">group</span>
          <p className="text-on-surface-variant/50 text-sm">
            {debouncedSearch ? 'No users match your search.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <div className="border border-outline-variant/10 rounded-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_100px_120px_80px] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">Name</span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">Email</span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">Role</span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">Created</span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 text-right">Actions</span>
          </div>

          {/* Table rows */}
          {users.map((u) => {
            const isSelf = currentUser?.email === u.email;
            const isAdmin = u.role?.toLowerCase() === 'admin';
            const isConfirming = confirmDeleteId === u.id;

            return (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_1fr_100px_120px_80px] gap-4 px-6 py-4 border-b border-outline-variant/5 hover:bg-surface-container-lowest/50 transition-colors items-center"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary text-xs font-semibold">
                      {u.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-on-surface font-medium truncate">{u.name}</span>
                </div>

                {/* Email */}
                <span className="text-sm text-on-surface-variant truncate">{u.email}</span>

                {/* Role badge */}
                <div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-label uppercase tracking-widest ${
                      isAdmin
                        ? 'bg-primary/15 text-primary border border-primary/20'
                        : 'bg-surface-container text-on-surface-variant/60 border border-outline-variant/10'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'User'}
                  </span>
                </div>

                {/* Created date */}
                <span className="text-xs text-on-surface-variant/50">
                  {u.createdAt ? formatDate(u.createdAt) : '--'}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-widest text-tertiary hover:text-on-surface transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(u)}
                        title="Edit user"
                        className="p-1.5 text-on-surface-variant/50 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(u.id)}
                        disabled={isSelf}
                        title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                        className="p-1.5 text-on-surface-variant/50 hover:text-tertiary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer */}
    </div>

    <AdminUserDrawer
      open={drawerOpen}
      onClose={handleCloseDrawer}
      user={editingUser}
    />
    </>
  );
}
