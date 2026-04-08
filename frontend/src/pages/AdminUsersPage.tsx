/**
 * AdminUsersPage — thin orchestrator (Tier 3 top-level page).
 *
 * Admin-only page for managing the user directory. All state and data
 * fetching live in useAdminUsersPage; this file only composes the back
 * link, hero section, list section, and the create/edit drawer.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground } from '@/shared/ui';
import { AdminUserDrawer } from '@/features/admin/ui/AdminUserDrawer';
import { useAdminUsersPage } from '@/features/admin/hooks/useAdminUsersPage';
import {
  AdminUsersHeroSection,
  AdminUsersListSection,
} from '@/features/admin/sections';

export default function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const page = useAdminUsersPage();

  return (
    <>
      <SectionBackground />
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        <div className="flex justify-center pt-6 pb-8">
          <Link
            to="/campaigns"
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            {t('my_campaigns')}
          </Link>
        </div>

        <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
          <AdminUsersHeroSection onCreate={page.openCreate} />

          <AdminUsersListSection
            users={page.users}
            isLoading={page.isLoading}
            search={page.search}
            onSearchChange={page.setSearch}
            debouncedSearch={page.debouncedSearch}
            confirmDeleteId={page.confirmDeleteId}
            onEdit={page.openEdit}
            onRequestDelete={page.requestDelete}
            onCancelDelete={page.cancelDelete}
            onConfirmDelete={page.confirmDelete}
          />
        </div>
      </main>

      <AdminUserDrawer
        open={page.drawerOpen}
        onClose={page.closeDrawer}
        user={page.editingUser}
      />
    </>
  );
}
