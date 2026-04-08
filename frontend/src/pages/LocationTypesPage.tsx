/**
 * LocationTypesPage — thin orchestrator (Tier 2 list/admin page).
 *
 * Reads the campaign id, loads the location-type list and containment rules
 * via useLocationTypesPage, and composes the section widgets:
 *
 *   - HeroSection             — header card with title + add button
 *   - ListSection (left col)  — searchable, grouped list of types
 *   - CreateSection (right)   — visible when "showNew" is true
 *   - DetailSection (right)   — visible when an entry is selected
 *
 * All section state lives in the hook so the page stays compositional.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { useLocationTypesPage } from '@/features/locationTypes/hooks/useLocationTypesPage';
import {
  LocationTypesHeroSection,
  LocationTypesListSection,
  LocationTypeDetailSection,
  LocationTypeCreateSection,
} from '@/features/locationTypes/sections';

export default function LocationTypesPage() {
  const { t } = useTranslation('locations');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = useLocationTypesPage(cId);
  const {
    campaignTitle,
    locationTypesEnabled,
    isLoading,
    types,
    containRules,
    sorted,
    filtered,
    selected,
    showNew,
    search,
    setSearch,
    startNew,
    selectType,
    cancelNew,
    finishCreate,
    clearSelection,
  } = page;

  if (!locationTypesEnabled) {
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

        {/* Content -- single max-width container */}
        <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
          <LocationTypesHeroSection onAddNew={startNew} />

          {isLoading ? (
            <div className="flex items-center gap-3 p-12 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {t('types_loading')}
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 min-h-[480px]">
              <LocationTypesListSection
                filtered={filtered}
                totalCount={sorted.length}
                search={search}
                onSearchChange={setSearch}
                selectedId={selected?.id ?? null}
                showNew={showNew}
                onSelect={selectType}
              />

              {/* Right panel -- detail / new form card */}
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex-1 overflow-hidden min-h-[400px]">
                {showNew ? (
                  <LocationTypeCreateSection
                    campaignId={cId}
                    onCreated={finishCreate}
                    onCancel={cancelNew}
                  />
                ) : selected ? (
                  <LocationTypeDetailSection
                    key={selected.id}
                    campaignId={cId}
                    entry={selected}
                    allTypes={types}
                    containRules={containRules}
                    onDeleted={clearSelection}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                    {t('types_select_prompt')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
