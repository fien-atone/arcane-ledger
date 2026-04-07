import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations, useSetLocationVisibility } from '@/features/locations/api';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import { useLocationTypes } from '@/features/locationTypes';
import type { Location, LocationType } from '@/entities/location';
import type { LocationTypeEntry } from '@/entities/locationType';
import { CATEGORY_HEX_COLOR } from '@/entities/locationType';

const CATEGORY_ORDER = ['world', 'geographic', 'water', 'civilization', 'poi', 'travel'];

type TypeMap = Map<string, LocationTypeEntry>;

export default function LocationListPage() {
  const { t } = useTranslation('locations');
  const { id: campaignId } = useParams<{ id: string }>();
  const locationsEnabled = useSectionEnabled(campaignId ?? '', 'locations');
  const locationTypesEnabled = useSectionEnabled(campaignId ?? '', 'location_types');
  const partyEnabled = useSectionEnabled(campaignId ?? '', 'party');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const { data: locations, isLoading, isError } = useLocations(campaignId ?? '');
  const setLocationVisibility = useSetLocationVisibility();
  const { data: locationTypes = [] } = useLocationTypes(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeFilter = (searchParams.get('type') ?? 'all') as LocationType | 'all';

  const [addOpen, setAddOpen] = useState(false);

  // Build id -> entry lookup
  const typeMap = useMemo<TypeMap>(
    () => new Map(locationTypes.map((t) => [t.id, t])),
    [locationTypes],
  );

  // Type order based on category hierarchy
  const typeOrder = useMemo(
    () => [...locationTypes].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
    ).map((t) => t.id),
    [locationTypes],
  );

  // Filters: All + only types that appear in this campaign's locations
  const typeFilters = useMemo(() => {
    const usedTypeIds = new Set(locations?.map((l) => l.type) ?? []);
    const usedTypes = typeOrder
      .map((id) => typeMap.get(id))
      .filter((t): t is LocationTypeEntry => !!t && usedTypeIds.has(t.id));
    return [
      { value: 'all' as const, label: t('filter_all') },
      ...usedTypes.map((lt) => ({ value: lt.id, label: lt.name })),
    ];
  }, [locations, typeOrder, typeMap, t]);

  // Depth map for hierarchy indent
  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!locations) return map;
    locations.forEach((l) => { if (!l.parentLocationId) map.set(l.id, 0); });
    let changed = true;
    while (changed) {
      changed = false;
      locations.forEach((l) => {
        if (!map.has(l.id) && l.parentLocationId) {
          const pd = map.get(l.parentLocationId);
          if (pd !== undefined) { map.set(l.id, pd + 1); changed = true; }
        }
      });
    }
    return map;
  }, [locations]);

  const sortByCategory = useMemo(() => (a: Location, b: Location) => {
    const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
    const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
    if (catA !== catB) return catA - catB;
    return a.name.localeCompare(b.name);
  }, [typeMap]);

  const filtered = useMemo(() => {
    const list = locations?.filter((l) => {
      const matchesType = typeFilter === 'all' || l.type === typeFilter;
      const matchesSearch =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase());
      return matchesType && matchesSearch;
    }) ?? [];

    // In "all" mode without search: hierarchical sort (parents -> children)
    if (typeFilter === 'all' && !search) {
      const byParent = new Map<string, Location[]>();
      const roots: Location[] = [];
      for (const loc of list) {
        if (!loc.parentLocationId) {
          roots.push(loc);
        } else {
          if (!byParent.has(loc.parentLocationId)) byParent.set(loc.parentLocationId, []);
          byParent.get(loc.parentLocationId)!.push(loc);
        }
      }
      const result: Location[] = [];
      const walk = (loc: Location) => {
        result.push(loc);
        (byParent.get(loc.id) ?? []).sort(sortByCategory).forEach(walk);
      };
      roots.sort(sortByCategory).forEach(walk);
      // Orphans (parent not in filtered list): append at end
      const seen = new Set(result.map((l) => l.id));
      list.filter((l) => !seen.has(l.id)).sort(sortByCategory).forEach((l) => result.push(l));
      return result;
    }

    return [...list].sort(sortByCategory);
  }, [locations, typeFilter, search, sortByCategory]);

  if (!locationsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? t('common:campaign')}
        </Link>
      </div>

      {/* Content — single max-width container */}
      <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">{t('title')}</h1>
              <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
            </div>
            {isGm && (
              <button
                onClick={() => setAddOpen(true)}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">add_location</span>
                <span className="font-label text-xs uppercase tracking-widest">{t('add_location')}</span>
              </button>
            )}
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchParams(prev => {
                    if (val) prev.set('q', val); else prev.delete('q');
                    return prev;
                  }, { replace: true });
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
              />
            </div>
            {locationTypesEnabled && (
              <div className="flex flex-wrap gap-1.5">
                {typeFilters.map(({ value, label }) => {
                  const count = value === 'all'
                    ? (locations?.length ?? 0)
                    : (locations?.filter((l) => l.type === value).length ?? 0);
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setSearchParams(prev => {
                          if (value === 'all') prev.delete('type'); else prev.set('type', value);
                          return prev;
                        }, { replace: true });
                      }}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                        typeFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                      }`}
                    >
                      {label} <span className={typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <span className="ml-auto text-[10px] text-on-surface-variant/40">
              <span className="text-on-surface font-bold">{filtered.length}</span> {t('common:of')} <span className="text-primary font-bold">{locations?.length ?? 0}</span>
            </span>
          </div>
        </div>

        {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>{t('loading')}</div>}
        {isError && <p className="text-tertiary text-sm p-12">{t('error')}</p>}

        {!isLoading && !isError && (
          filtered.length === 0 ? (
            <EmptyState icon="location_on" title={t('empty_title')} subtitle={t('empty_subtitle')} />
          ) : (
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
              {/* Column headers */}
              <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
                <span className="w-9 flex-shrink-0" />
                <span className="flex-1 min-w-0">{t('column_name')}</span>
                <span className="w-20 flex-shrink-0 hidden xl:block">{t('column_population')}</span>
                {isGm && partyEnabled && <span className="w-8 flex-shrink-0" />}
              </div>
              {filtered.map((loc) => {
                const typeEntry = locationTypesEnabled ? typeMap.get(loc.type) : undefined;
                const depth = depthMap.get(loc.id) ?? 0;
                const indent = typeFilter === 'all' && !search ? depth * 20 : 0;
                return (
                  <Link
                    key={loc.id}
                    to={`/campaigns/${campaignId}/locations/${loc.id}`}
                    className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {/* Tree connector for nested items */}
                      {indent > 0 && (
                        <div className="flex items-center flex-shrink-0" style={{ width: indent }}>
                          {Array.from({ length: depth }).map((_, i) => (
                            <div key={i} className="w-5 h-9 flex-shrink-0 relative">
                              {/* Vertical line */}
                              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />
                              {/* Horizontal branch on last segment */}
                              {i === depth - 1 && (
                                <div className="absolute left-1/2 top-1/2 w-2.5 h-px bg-primary/30" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-sm border border-outline-variant/15 flex-shrink-0 flex items-center justify-center bg-surface-container">
                        <span
                          className="material-symbols-outlined text-[18px]"
                          style={typeEntry ? { color: CATEGORY_HEX_COLOR[typeEntry.category] } : undefined}
                        >
                          {typeEntry?.icon ?? 'location_on'}
                        </span>
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{loc.name}</p>
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate">
                          {typeEntry?.name ?? loc.type}
                        </p>
                      </div>
                      {/* Population */}
                      <span className="w-20 flex-shrink-0 text-xs text-on-surface-variant/60 hidden xl:block">
                        {loc.settlementPopulation ? loc.settlementPopulation.toLocaleString() : '\u2014'}
                      </span>
                      {/* Visibility toggle */}
                      {isGm && partyEnabled && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setLocationVisibility.mutate({
                              campaignId: campaignId!,
                              id: loc.id,
                              playerVisible: !loc.playerVisible,
                              playerVisibleFields: loc.playerVisibleFields ?? [],
                            });
                          }}
                          title={loc.playerVisible ? t('visible_to_players') : t('hidden_from_players')}
                          className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                            loc.playerVisible ? 'text-primary/60 hover:text-primary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {loc.playerVisible ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>{/* end max-w-5xl container */}

    </main>

    <LocationEditDrawer
      open={addOpen}
      onClose={() => setAddOpen(false)}
      campaignId={campaignId ?? ''}
    />
    </>
  );
}
