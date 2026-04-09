/**
 * SessionListPage — thin orchestrator (Tier 2 list page).
 *
 * Reads the campaign id, loads the list data via useSessionListPage, and
 * composes the list section widgets:
 *
 *   - SessionListHeroSection — header card with title, add button, search,
 *                              counter
 *   - SessionListSection     — loading / error / empty / date-sorted list
 *                              with Today / Tomorrow / Next / Previous badges
 *
 * The SessionEditDrawer is rendered at the page level because its open state
 * is owned by the hook and the page opens it from the hero section's CTA.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { SessionEditDrawer } from '@/features/sessions/ui';
import { useSessionListPage } from '@/features/sessions/hooks/useSessionListPage';
import {
  SessionListHeroSection,
  SessionListSection,
} from '@/features/sessions/sections';

export default function SessionListPage() {
  const { t } = useTranslation('sessions');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useSessionListPage(cId);
  const {
    campaignTitle,
    sessionsEnabled,
    isGm,
    isLoading,
    isError,
    sessions,
    search,
    setSearch,
    addOpen,
    openAdd,
    closeAdd,
    formatDate,
    getBadge,
  } = page;

  if (!sessionsEnabled) {
    return <SectionDisabled campaignId={cId} />;
  }

  return (
    <>
      <SectionBackground />
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        {/* Campaign name */}
        <div className="flex justify-center pt-0 pb-8">
          <Link
            to={`/campaigns/${cId}`}
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            {campaignTitle ?? t('common:campaign')}
          </Link>
        </div>

        {/* Content — single max-width container */}
        <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
          <SessionListHeroSection
            isGm={isGm}
            search={search}
            onSearchChange={setSearch}
            shownCount={sessions?.length ?? 0}
            onAdd={openAdd}
          />

          <SessionListSection
            campaignId={cId}
            isLoading={isLoading}
            isError={isError}
            filtered={sessions ?? []}
            formatDate={formatDate}
            getBadge={getBadge}
          />
        </div>
      </main>

      <SessionEditDrawer
        open={addOpen}
        onClose={closeAdd}
        campaignId={cId}
      />
    </>
  );
}
