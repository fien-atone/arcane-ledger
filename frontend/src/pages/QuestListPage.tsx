/**
 * QuestListPage — thin orchestrator (Tier 2 list page).
 *
 * Reads the campaign id, loads the list data via useQuestListPage, and
 * composes the list section widgets:
 *
 *   - QuestListHeroSection — header card with title, add button, search,
 *                            status filter chips, counter
 *   - QuestListSection     — loading / error / empty / list of rows with
 *                            status pill and the GM-only visibility toggle
 *
 * The QuestEditDrawer is rendered at the page level because its open state
 * is owned by the hook and the page opens it from the hero section's CTA.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { QuestEditDrawer } from '@/features/quests/ui';
import { useQuestListPage } from '@/features/quests/hooks/useQuestListPage';
import {
  QuestListHeroSection,
  QuestListSection,
} from '@/features/quests/sections';

export default function QuestListPage() {
  const { t } = useTranslation('quests');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useQuestListPage(cId);
  const {
    campaignTitle,
    questsEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    quests,
    filtered,
    statusFilters,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    addOpen,
    openAdd,
    closeAdd,
    toggleVisibility,
  } = page;

  if (!questsEnabled) {
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
          <QuestListHeroSection
            isGm={isGm}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusFilters={statusFilters}
            filteredCount={filtered.length}
            totalCount={quests?.length ?? 0}
            onAdd={openAdd}
          />

          <QuestListSection
            campaignId={cId}
            isGm={isGm}
            partyEnabled={partyEnabled}
            isLoading={isLoading}
            isError={isError}
            filtered={filtered}
            onToggleVisibility={toggleVisibility}
          />
        </div>
      </main>

      <QuestEditDrawer
        open={addOpen}
        onClose={closeAdd}
        campaignId={cId}
      />
    </>
  );
}
