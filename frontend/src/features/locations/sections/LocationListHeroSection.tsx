/**
 * LocationListHeroSection — header card for the LocationListPage.
 *
 * Contains the page title/subtitle, the GM-only "add location" CTA, and
 * the filter row (search input, type-filter chips with counts, and the
 * filtered/total counter on the right).
 *
 * Presentational: all state (search, typeFilter, counts) is passed in as
 * props from useLocationListPage.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import type { LocationType } from '@/entities/location';
import type { TypeFilterOption } from '../hooks/useLocationListPage';

interface Props {
  isGm: boolean;
  locationTypesEnabled: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: LocationType | 'all';
  onTypeFilterChange: (v: LocationType | 'all') => void;
  typeFilters: TypeFilterOption[];
  filteredCount: number;
  totalCount: number;
  onAdd: () => void;
}

export function LocationListHeroSection({
  isGm,
  locationTypesEnabled,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  typeFilters,
  filteredCount,
  totalCount,
  onAdd,
}: Props) {
  const { t } = useTranslation('locations');

  return (
    <SectionPanel className="mb-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {t('title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
        </div>
        {isGm && (
          <button
            onClick={onAdd}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">
              add_location
            </span>
            <span className="font-label text-xs uppercase tracking-widest">
              {t('add_location')}
            </span>
          </button>
        )}
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
          />
        </div>
        {locationTypesEnabled && (
          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => onTypeFilterChange(value)}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                  typeFilter === value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {label}{' '}
                <span
                  className={
                    typeFilter === value
                      ? 'text-on-primary/70'
                      : 'text-on-surface-variant/40'
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-[10px] text-on-surface-variant/40">
          <span className="text-on-surface font-bold">{filteredCount}</span>{' '}
          {t('common:of')}{' '}
          <span className="text-primary font-bold">{totalCount}</span>
        </span>
      </div>
    </SectionPanel>
  );
}
