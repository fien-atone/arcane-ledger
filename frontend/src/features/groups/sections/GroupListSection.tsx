/**
 * GroupListSection — main list card for GroupListPage.
 *
 * Renders loading / error / empty states and, once loaded, a table of group
 * rows with type icon, name, type name column, and (for GMs with the party
 * section enabled) a visibility toggle.
 *
 * Presentational: receives the already-filtered list + resolveType +
 * handlers from useGroupListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import type { Group } from '@/entities/group';
import type { ResolvedGroupType } from '../hooks/useGroupListPage';

interface Props {
  campaignId: string;
  isGm: boolean;
  groupTypesEnabled: boolean;
  partyEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
  filtered: Group[];
  resolveType: (typeId: string) => ResolvedGroupType;
  onToggleVisibility: (group: Group) => void;
}

export function GroupListSection({
  campaignId,
  isGm,
  groupTypesEnabled,
  partyEnabled,
  isLoading,
  isError,
  filtered,
  resolveType,
  onToggleVisibility,
}: Props) {
  const { t } = useTranslation('groups');

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
        icon="groups"
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
        {groupTypesEnabled && (
          <span className="w-28 flex-shrink-0 hidden lg:block">
            {t('column_type')}
          </span>
        )}
        {isGm && partyEnabled && <span className="w-8 flex-shrink-0" />}
      </div>
      {filtered.map((g) => {
        const tc = resolveType(g.type);
        return (
          <Link
            key={g.id}
            to={`/campaigns/${campaignId}/groups/${g.id}`}
            className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-9 h-9 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">
                  {tc.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                  {g.name}
                </p>
                {groupTypesEnabled && (
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate lg:hidden">
                    {tc.name}
                  </p>
                )}
              </div>
              {groupTypesEnabled && (
                <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 truncate hidden lg:block">
                  {tc.name}
                </span>
              )}
              {isGm && partyEnabled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisibility(g);
                  }}
                  title={
                    g.playerVisible
                      ? t('visible_to_players')
                      : t('hidden_from_players')
                  }
                  className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                    g.playerVisible
                      ? 'text-primary/60 hover:text-primary'
                      : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {g.playerVisible ? 'visibility' : 'visibility_off'}
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
