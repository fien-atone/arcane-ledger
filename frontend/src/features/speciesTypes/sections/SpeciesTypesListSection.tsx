/**
 * SpeciesTypesListSection — left column of the SpeciesTypes admin page.
 *
 * Renders the searchable list of species types as a flat, server-filtered
 * list. Highlights the active selection and reports selection changes via
 * onSelect.
 *
 * Receives:
 * - types list (already server-filtered by debounced search in the hook)
 * - search string + setter
 * - selectedId + showNew + onSelect
 */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

interface Props {
  types: SpeciesTypeEntry[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  showNew: boolean;
  onSelect: (id: string) => void;
}

export function SpeciesTypesListSection({
  types,
  search,
  onSearchChange,
  selectedId,
  showNew,
  onSelect,
}: Props) {
  const { t } = useTranslation('species');

  const isSearching = search.trim().length > 0;
  const isEmpty = types.length === 0;

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
        {isEmpty && (
          <EmptyState
            icon="category"
            title={isSearching ? t('empty_title') : t('types_empty_title')}
            subtitle={isSearching ? undefined : t('types_empty_subtitle')}
          />
        )}
        {types.map((entry) => {
          const isActive = !showNew && selectedId === entry.id;
          return (
            <button
              key={entry.id}
              onClick={() => onSelect(entry.id)}
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
                  className={`material-symbols-outlined text-[17px] ${
                    isActive ? 'text-primary' : 'text-on-surface-variant/50'
                  }`}
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
              </div>
            </button>
          );
        })}
      </div>
      {!isEmpty && (
        <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
          <p className="text-[10px] text-on-surface-variant/40">
            <span className="text-primary font-bold">{types.length}</span> types
          </p>
        </div>
      )}
    </div>
  );
}
