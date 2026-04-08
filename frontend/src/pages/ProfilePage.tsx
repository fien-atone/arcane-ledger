/**
 * ProfilePage — thin orchestrator (Tier 3 top-level page).
 *
 * The current user's own profile: name/email, language, password change.
 * All state and mutations live inside the section widgets — this file only
 * composes the back link, hero, and three self-contained form sections.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground } from '@/shared/ui';
import {
  ProfileHeroSection,
  ProfileInfoSection,
  ProfileLanguageSection,
  ProfilePasswordSection,
} from '@/features/auth/sections';

export default function ProfilePage() {
  const { t } = useTranslation('profile');

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
            {t('common:nav.my_campaigns')}
          </Link>
        </div>

        <div className="px-4 sm:px-8 max-w-3xl mx-auto w-full pb-20">
          <ProfileHeroSection />
          <ProfileInfoSection />
          <ProfileLanguageSection />
          <ProfilePasswordSection />
        </div>
      </main>
    </>
  );
}
