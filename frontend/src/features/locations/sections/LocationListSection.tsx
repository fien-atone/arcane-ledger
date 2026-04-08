/**
 * LocationListSection — main list card for LocationListPage.
 *
 * Renders the loading/error/empty states and, once loaded, a hierarchical
 * table of locations. When the filter is "all" and there is no search, rows
 * are indented based on their depth in the parent tree (computed upstream
 * in useLocationListPage).
 *
 * Presentational: receives the already-filtered list + maps + handlers
 * from useLocationListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import { CATEGORY_HEX_COLOR } from '@/entities/locationType';
import type { Location, LocationType } from '@/entities/location';
import type { TypeMap } from '../hooks/useLocationListPage';

interface Props {
  campaignId: string;
  isGm: boolean;
  partyEnabled: boolean;
  locationTypesEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
  filtered: Location[];
  typeMap: TypeMap;
  depthMap: Map<string, number>;
  typeFilter: LocationType | 'all';
  search: string;
  onToggleVisibility: (loc: Location) => void;
}

export function LocationListSection({
  campaignId,
  isGm,
  partyEnabled,
  locationTypesEnabled,
  isLoading,
  isError,
  filtered,
  typeMap,
  depthMap,
  typeFilter,
  search,
  onToggleVisibility,
}: Props) {
  const { t } = useTranslation('locations');

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-12 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">
          progress_activity
        </span>
        {t('loading')}
      </div>
    );
  }

  if (isError) {
    return <p className="text-tertiary text-sm p-12">{t('error')}</p>;
  }

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon="location_on"
        title={t('empty_title')}
        subtitle={t('empty_subtitle')}
      />
    );
  }

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
        <span className="w-9 flex-shrink-0" />
        <span className="flex-1 min-w-0">{t('column_name')}</span>
        <span className="w-20 flex-shrink-0 hidden xl:block">
          {t('column_population')}
        </span>
        {isGm && partyEnabled && <span className="w-8 flex-shrink-0" />}
      </div>
      {filtered.map((loc) => {
        const typeEntry = locationTypesEnabled
          ? typeMap.get(loc.type)
          : undefined;
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
                <div
                  className="flex items-center flex-shrink-0"
                  style={{ width: indent }}
                >
                  {Array.from({ length: depth }).map((_, i) => (
                    <div
                      key={i}
                      className="w-5 h-9 flex-shrink-0 relative"
                    >
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
                  style={
                    typeEntry
                      ? { color: CATEGORY_HEX_COLOR[typeEntry.category] }
                      : undefined
                  }
                >
                  {typeEntry?.icon ?? 'location_on'}
                </span>
              </div>
              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                  {loc.name}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate">
                  {typeEntry?.name ?? loc.type}
                </p>
              </div>
              {/* Population */}
              <span className="w-20 flex-shrink-0 text-xs text-on-surface-variant/60 hidden xl:block">
                {loc.settlementPopulation
                  ? loc.settlementPopulation.toLocaleString()
                  : '\u2014'}
              </span>
              {/* Visibility toggle */}
              {isGm && partyEnabled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisibility(loc);
                  }}
                  title={
                    loc.playerVisible
                      ? t('visible_to_players')
                      : t('hidden_from_players')
                  }
                  className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                    loc.playerVisible
                      ? 'text-primary/60 hover:text-primary'
                      : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
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
  );
}
