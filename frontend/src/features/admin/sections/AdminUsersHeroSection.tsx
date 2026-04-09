/**
 * AdminUsersHeroSection — header card at the top of the admin users page.
 *
 * Shows the admin panel icon, title, subtitle, and the Create User CTA.
 * Presentation-only; the drawer open state lives in useAdminUsersPage.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';

interface Props {
  onCreate: () => void;
}

export function AdminUsersHeroSection({ onCreate }: Props) {
  const { t } = useTranslation('admin');

  return (
    <SectionPanel className="mb-8">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: '32px' }}
          >
            admin_panel_settings
          </span>
          <div>
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              {t('title')}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              {t('subtitle')}
            </p>
          </div>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          {t('create_user')}
        </button>
      </div>
    </SectionPanel>
  );
}
