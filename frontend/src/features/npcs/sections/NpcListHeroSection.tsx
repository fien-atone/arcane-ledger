/**
 * NpcListHeroSection — header card for the NpcListPage.
 *
 * Contains the page title/subtitle, the list/graph view switcher (only when
 * social_graph is enabled), the GM-only "add NPC" CTA, and the filter row
 * (search input, status-filter chips with counts, and the filtered/total
 * counter on the right).
 *
 * Presentational: all state (search, statusFilter, counts) is passed in as
 * props from useNpcListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import type { StatusFilter, StatusFilterOption } from '../hooks/useNpcListPage';

interface Props {
  campaignId: string;
  isGm: boolean;
  socialGraphEnabled: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (v: StatusFilter) => void;
  statusFilters: StatusFilterOption[];
  /**
   * Number of NPCs in the currently displayed (server-filtered) list.
   * With server-side filtering we can no longer show an "X of Y" ratio
   * without a second aggregation query, so we display just the current
   * count. See F-11 notes in useNpcListPage.
   */
  shownCount: number;
  onAdd: () => void;
}

export function NpcListHeroSection({
  campaignId,
  isGm,
  socialGraphEnabled,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusFilters,
  shownCount,
  onAdd,
}: Props) {
  const { t } = useTranslation('npcs');

  return (
    <SectionPanel className="mb-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {t('title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {socialGraphEnabled && (
            <div className="flex bg-surface-container-high rounded-sm border border-outline-variant/20 overflow-hidden">
              <button
                className="p-2 bg-primary/15 text-primary"
                title={t('list_view')}
                disabled
              >
                <span className="material-symbols-outlined text-[20px]">list</span>
              </button>
              <Link
                to={`/campaigns/${campaignId}/npcs/relationships`}
                className="p-2 text-on-surface-variant hover:text-primary hover:bg-surface-container-highest transition-colors"
                title={t('graph_view')}
              >
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </Link>
            </div>
          )}
          {isGm && (
            <button
              onClick={onAdd}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">
                {t('add_npc')}
              </span>
            </button>
          )}
        </div>
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
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onStatusFilterChange(value)}
              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                statusFilter === value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-on-surface-variant/40">
          <span className="text-primary font-bold">{shownCount}</span>
        </span>
      </div>
    </SectionPanel>
  );
}
