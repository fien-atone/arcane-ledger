/**
 * LocationListPage — thin orchestrator (Tier 2 list page).
 *
 * Reads the campaign id, loads the list data via useLocationListPage, and
 * composes the list section widgets:
 *
 *   - LocationListHeroSection  — header card with title, add CTA, search +
 *                                type-filter chips, filtered/total counter
 *   - LocationListSection      — loading / error / empty / list of rows
 *
 * The LocationEditDrawer is rendered at the page level because its open state
 * is owned by the hook and the page opens it from the hero section's CTA.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useLocationListPage } from '@/features/locations/hooks/useLocationListPage';
import {
  LocationListHeroSection,
  LocationListSection,
} from '@/features/locations/sections';

export default function LocationListPage() {
  const { t } = useTranslation('locations');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useLocationListPage(cId);
  const {
    campaignTitle,
    locationsEnabled,
    locationTypesEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    locations,
    filtered,
    typeMap,
    typeFilters,
    depthMap,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    addOpen,
    openAdd,
    closeAdd,
    toggleVisibility,
  } = page;

  if (!locationsEnabled) {
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
          <LocationListHeroSection
            isGm={isGm}
            locationTypesEnabled={locationTypesEnabled}
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            typeFilters={typeFilters}
            filteredCount={filtered.length}
            totalCount={locations?.length ?? 0}
            onAdd={openAdd}
          />

          <LocationListSection
            campaignId={cId}
            isGm={isGm}
            partyEnabled={partyEnabled}
            locationTypesEnabled={locationTypesEnabled}
            isLoading={isLoading}
            isError={isError}
            filtered={filtered}
            typeMap={typeMap}
            depthMap={depthMap}
            typeFilter={typeFilter}
            search={search}
            onToggleVisibility={toggleVisibility}
          />
        </div>
      </main>

      <LocationEditDrawer
        open={addOpen}
        onClose={closeAdd}
        campaignId={cId}
      />
    </>
  );
}
