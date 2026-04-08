/**
 * LocationTypesListSection — left column of the LocationTypes admin page.
 *
 * Renders the searchable list of location types, grouped by category when
 * not searching, flat list when searching. Highlights the active selection
 * and reports selection changes via onSelect.
 *
 * Receives:
 * - filtered + sorted lists (already derived in useLocationTypesPage)
 * - search string + setter
 * - selectedId + showNew + onSelect
 *
 * The TypeRow sub-component lives inside this file because it is not used
 * anywhere else and only renders one entry of this list.
 */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import {
  CATEGORY_DOT_CLS,
  CATEGORY_ICON_COLOR,
} from '@/entities/locationType';
import type {
  LocationTypeEntry,
  LocationTypeCategory,
} from '@/entities/locationType';
import { CATEGORY_ORDER } from '../hooks/useLocationTypesPage';

interface TypeRowProps {
  t: LocationTypeEntry;
  isActive: boolean;
  onSelect: () => void;
  builtInLabel: string;
}

function TypeRow({ t: entry, isActive, onSelect, builtInLabel }: TypeRowProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
        isActive
          ? 'bg-primary/8 border-l-2 border-l-primary'
          : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
      }`}
    >
      <div
        className={`w-9 h-9 rounded-sm flex-shrink-0 flex items-center justify-center border ${
          isActive
            ? 'bg-primary/10 border-primary/30'
            : 'bg-surface-container-highest border-outline-variant/20'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[17px] ${CATEGORY_ICON_COLOR[entry.category]}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {entry.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm truncate transition-colors ${
            isActive ? 'text-primary font-semibold' : 'text-on-surface font-medium'
          }`}
        >
          {entry.name}
        </p>
        {entry.builtin && (
          <p
            className={`text-[9px] mt-0.5 uppercase tracking-widest ${
              isActive ? 'text-primary/40' : 'text-on-surface-variant/30'
            }`}
          >
            {builtInLabel}
          </p>
        )}
      </div>
    </button>
  );
}

interface Props {
  filtered: LocationTypeEntry[];
  totalCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  showNew: boolean;
  onSelect: (id: string) => void;
}

export function LocationTypesListSection({
  filtered,
  totalCount,
  search,
  onSearchChange,
  selectedId,
  showNew,
  onSelect,
}: Props) {
  const { t } = useTranslation('locations');

  const CATEGORIES: { value: LocationTypeCategory; label: string; dot: string }[] = [
    { value: 'world',        label: t('category_world'),        dot: CATEGORY_DOT_CLS.world },
    { value: 'civilization', label: t('category_civilization'), dot: CATEGORY_DOT_CLS.civilization },
    { value: 'geographic',   label: t('category_geographic'),   dot: CATEGORY_DOT_CLS.geographic },
    { value: 'water',        label: t('category_water'),        dot: CATEGORY_DOT_CLS.water },
    { value: 'poi',          label: t('category_poi'),          dot: CATEGORY_DOT_CLS.poi },
    { value: 'travel',       label: t('category_travel'),       dot: CATEGORY_DOT_CLS.travel },
  ];

  const isSearching = search.trim().length > 0;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm flex flex-col w-full md:w-[320px] md:flex-shrink-0 overflow-hidden">
      {/* Search */}
      <div className="px-3 py-2.5 border-b border-outline-variant/10 flex-shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">
            search
          </span>
          <input
            type="text"
            placeholder={t('types_search_placeholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
        {filtered.length === 0 && (
          <EmptyState
            icon="account_tree"
            title={isSearching ? t('types_empty_search') : t('types_empty')}
            subtitle={isSearching ? undefined : t('types_empty_subtitle')}
          />
        )}
        {isSearching
          ? filtered.map((lt) => (
              <TypeRow
                key={lt.id}
                t={lt}
                isActive={!showNew && selectedId === lt.id}
                onSelect={() => onSelect(lt.id)}
                builtInLabel={t('types_built_in')}
              />
            ))
          : CATEGORY_ORDER.map((cat) => {
              const group = filtered.filter((lt) => lt.category === cat);
              if (group.length === 0) return null;
              const meta = CATEGORIES.find((c) => c.value === cat)!;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`}
                    />
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/35">
                      {meta.label}
                    </span>
                  </div>
                  {group.map((lt) => (
                    <TypeRow
                      key={lt.id}
                      t={lt}
                      isActive={!showNew && selectedId === lt.id}
                      onSelect={() => onSelect(lt.id)}
                      builtInLabel={t('types_built_in')}
                    />
                  ))}
                </div>
              );
            })}
      </div>
      <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
        <p className="text-[10px] text-on-surface-variant/40">
          <span className="text-primary font-bold">{totalCount}</span>{' '}
          {t('types_count_suffix')}
        </p>
      </div>
    </div>
  );
}
