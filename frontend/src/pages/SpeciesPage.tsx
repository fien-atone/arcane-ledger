/**
 * SpeciesPage — thin orchestrator (Tier 2 list page).
 *
 * Reads the campaign id, loads list data via useSpeciesListPage, and
 * composes the list section widgets:
 *
 *   - SpeciesListHeroSection — header card with title, add CTA, search,
 *                              type filter chips, and counter
 *   - SpeciesListSection     — loading / error / empty / rows list
 *
 * The SpeciesEditDrawer is rendered at the page level because its open
 * state is owned by the hook and the page opens it from the hero section's
 * CTA.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { SpeciesEditDrawer } from '@/features/species/ui';
import { useSpeciesListPage } from '@/features/species/hooks/useSpeciesListPage';
import {
  SpeciesListHeroSection,
  SpeciesListSection,
} from '@/features/species/sections';

export default function SpeciesPage() {
  const { t } = useTranslation('species');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useSpeciesListPage(cId);
  const {
    campaignTitle,
    speciesEnabled,
    typesEnabled,
    isLoading,
    isError,
    speciesList,
    typeFilters,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    resolveTypeName,
    drawerOpen,
    openDrawer,
    closeDrawer,
  } = page;

  if (!speciesEnabled) {
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
          <SpeciesListHeroSection
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            typeFilters={typeFilters}
            shownCount={speciesList?.length ?? 0}
            onAdd={openDrawer}
          />

          <SpeciesListSection
            campaignId={cId}
            isLoading={isLoading}
            isError={isError}
            filtered={speciesList ?? []}
            typesEnabled={typesEnabled}
            resolveTypeName={resolveTypeName}
          />
        </div>
      </main>

      <SpeciesEditDrawer
        campaignId={cId}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </>
  );
}
