/**
 * NpcListPage — thin orchestrator (Tier 2 list page).
 *
 * Reads the campaign id, loads the list data via useNpcListPage, and
 * composes the list section widgets:
 *
 *   - NpcListHeroSection — header card with title, list/graph switcher,
 *                          add CTA, search + status-filter chips, counter
 *   - NpcListSection     — loading / error / empty / list of rows
 *
 * The NpcEditDrawer is rendered at the page level because its open state
 * is owned by the hook and the page opens it from the hero section's CTA.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { useNpcListPage } from '@/features/npcs/hooks/useNpcListPage';
import {
  NpcListHeroSection,
  NpcListSection,
} from '@/features/npcs/sections';

export default function NpcListPage() {
  const { t } = useTranslation('npcs');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useNpcListPage(cId);
  const {
    campaignTitle,
    npcsEnabled,
    socialGraphEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    npcs,
    filtered,
    statusFilters,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    resolveSpeciesName,
    addOpen,
    openAdd,
    closeAdd,
    toggleVisibility,
  } = page;

  if (!npcsEnabled) {
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
          <NpcListHeroSection
            campaignId={cId}
            isGm={isGm}
            socialGraphEnabled={socialGraphEnabled}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusFilters={statusFilters}
            filteredCount={filtered.length}
            totalCount={npcs?.length ?? 0}
            onAdd={openAdd}
          />

          <NpcListSection
            campaignId={cId}
            isGm={isGm}
            partyEnabled={partyEnabled}
            isLoading={isLoading}
            isError={isError}
            filtered={filtered}
            resolveSpeciesName={resolveSpeciesName}
            onToggleVisibility={toggleVisibility}
          />
        </div>
      </main>

      <NpcEditDrawer
        open={addOpen}
        onClose={closeAdd}
        campaignId={cId}
      />
    </>
  );
}
