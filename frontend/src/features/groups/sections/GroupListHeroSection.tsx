/**
 * GroupListHeroSection — header card for the GroupListPage.
 *
 * Contains the page title/subtitle, the GM-only "add group" CTA, and the
 * filter row (search input, type-filter chips with counts, and the
 * filtered/total counter on the right). The type-filter chips only render
 * when the group_types section is enabled (typeFilters is empty otherwise).
 *
 * Presentational: all state (search, typeFilter, counts) is passed in as
 * props from useGroupListPage.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import type { TypeFilterOption } from '../hooks/useGroupListPage';

interface Props {
  isGm: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  typeFilters: TypeFilterOption[];
  /** F-11: number of groups in the currently displayed (server-filtered)
   *  list. No "of total" ratio — counts were dropped with the server-side
   *  filter switch. */
  shownCount: number;
  onAdd: () => void;
}

export function GroupListHeroSection({
  isGm,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  typeFilters,
  shownCount,
  onAdd,
}: Props) {
  const { t } = useTranslation('groups');

  return (
    <SectionPanel className="mb-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {t('title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            {t('subtitle')}
          </p>
        </div>
        {isGm && (
          <button
            onClick={onAdd}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">
              {t('add_group')}
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
        {typeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {typeFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onTypeFilterChange(value)}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                  typeFilter === value
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <span className="ml-auto text-[10px] text-on-surface-variant/40">
          <span className="text-primary font-bold">{shownCount}</span>
        </span>
      </div>
    </SectionPanel>
  );
}
