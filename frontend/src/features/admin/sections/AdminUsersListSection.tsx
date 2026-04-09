/**
 * AdminUsersListSection — card panel with the searchable users table.
 *
 * Renders the section header, the debounced search input, and a table of
 * users with inline edit/delete actions. Delete uses inline Yes/No confirm.
 * The "delete self" button is disabled so the logged-in admin can't lock
 * themselves out. All state is owned by useAdminUsersPage.
 */
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth';
import { SectionPanel } from '@/shared/ui';
import type { User } from '@/entities/user';

interface Props {
  users: User[] | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  debouncedSearch: string;
  confirmDeleteId: string | null;
  onEdit: (user: User) => void;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
}

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

export function AdminUsersListSection({
  users,
  isLoading,
  search,
  onSearchChange,
  debouncedSearch,
  confirmDeleteId,
  onEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: Props) {
  const { t, i18n } = useTranslation('admin');
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
  const currentUser = useAuthStore((s) => s.user);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <SectionPanel
      size="sm"
      title={t('users_section')}
      action={users && users.length > 0 ? (
        <span className="text-[10px] text-on-surface-variant/30">{users.length}</span>
      ) : undefined}
    >
      {/* Search */}
      <div className="mb-6">
        <label className={labelCls}>{t('search_label')}</label>
        <div className="relative max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-lg">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 pl-10 pr-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
          />
        </div>
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-primary mr-3">
            progress_activity
          </span>
          <span className="text-on-surface-variant text-sm">{t('loading_users')}</span>
        </div>
      ) : !users || users.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20 mb-4 block">
            group
          </span>
          <p className="text-on-surface-variant/50 text-sm">
            {debouncedSearch ? t('no_users_search') : t('no_users')}
          </p>
        </div>
      ) : (
        <div className="border border-outline-variant/10 rounded-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_100px_120px_80px] gap-4 px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">
              {t('table.name')}
            </span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">
              {t('table.email')}
            </span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">
              {t('table.role')}
            </span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50">
              {t('table.created')}
            </span>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/50 text-right">
              {t('table.actions')}
            </span>
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
                    {isAdmin ? t('roles.admin') : t('roles.user')}
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
                        onClick={() => onConfirmDelete(u.id)}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-widest text-tertiary hover:text-on-surface transition-colors"
                      >
                        {t('confirm_yes')}
                      </button>
                      <button
                        onClick={onCancelDelete}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        {t('confirm_no')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => onEdit(u)}
                        title={t('edit_user')}
                        className="p-1.5 text-on-surface-variant/50 hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => onRequestDelete(u.id)}
                        disabled={isSelf}
                        title={isSelf ? t('cannot_delete_self') : t('delete_user')}
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
    </SectionPanel>
  );
}
