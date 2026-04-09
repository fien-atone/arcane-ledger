/**
 * GroupListPage — thin orchestrator (Tier 2 list page).
 *
 * Reads the campaign id, loads the list data via useGroupListPage, and
 * composes the list section widgets:
 *
 *   - GroupListHeroSection — header card with title, add button, search,
 *                            type filter chips, counter
 *   - GroupListSection     — loading / error / empty / list of rows with
 *                            type icon, type name column and the GM-only
 *                            visibility toggle
 *
 * The GroupEditDrawer is rendered at the page level because its open state
 * is owned by the hook and the page opens it from the hero section's CTA.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { GroupEditDrawer } from '@/features/groups/ui';
import { useGroupListPage } from '@/features/groups/hooks/useGroupListPage';
import {
  GroupListHeroSection,
  GroupListSection,
} from '@/features/groups/sections';

export default function GroupListPage() {
  const { t } = useTranslation('groups');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useGroupListPage(cId);
  const {
    campaignTitle,
    groupsEnabled,
    groupTypesEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    groups,
    typeFilters,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    resolveType,
    addOpen,
    openAdd,
    closeAdd,
    toggleVisibility,
  } = page;

  if (!groupsEnabled) {
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
          <GroupListHeroSection
            isGm={isGm}
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            typeFilters={typeFilters}
            shownCount={groups?.length ?? 0}
            onAdd={openAdd}
          />

          <GroupListSection
            campaignId={cId}
            isGm={isGm}
            groupTypesEnabled={groupTypesEnabled}
            partyEnabled={partyEnabled}
            isLoading={isLoading}
            isError={isError}
            filtered={groups ?? []}
            resolveType={resolveType}
            onToggleVisibility={toggleVisibility}
          />
        </div>
      </main>

      <GroupEditDrawer
        open={addOpen}
        onClose={closeAdd}
        campaignId={cId}
      />
    </>
  );
}
