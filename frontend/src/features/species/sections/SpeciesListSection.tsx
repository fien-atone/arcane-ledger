/**
 * SpeciesListSection — main list card for SpeciesPage.
 *
 * Renders loading / error / empty states and, once loaded, a table of
 * species rows with a monogram avatar, name, resolved type name, and size
 * label. The type column only renders a value when species_types is
 * enabled.
 *
 * Presentational: receives the already-filtered list and the resolver
 * from useSpeciesListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import type { Species } from '@/entities/species';

interface Props {
  campaignId: string;
  isLoading: boolean;
  isError: boolean;
  filtered: Species[];
  typesEnabled: boolean;
  resolveTypeName: (typeId: string) => string;
}

export function SpeciesListSection({
  campaignId,
  isLoading,
  isError,
  filtered,
  typesEnabled,
  resolveTypeName,
}: Props) {
  const { t } = useTranslation('species');

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
        icon="blur_on"
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
        <span className="w-28 flex-shrink-0 hidden lg:block">
          {t('column_type')}
        </span>
        <span className="w-24 flex-shrink-0 hidden md:block">
          {t('column_size')}
        </span>
      </div>
      {filtered.map((s) => {
        const typeName = resolveTypeName(s.type);
        return (
          <Link
            key={s.id}
            to={`/campaigns/${campaignId}/species/${s.id}`}
            className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3 w-full min-w-0">
              <div className="w-9 h-9 rounded-sm border border-outline-variant/20 flex-shrink-0 overflow-hidden bg-surface-container-highest flex items-center justify-center">
                <span className="text-[10px] font-bold text-on-surface-variant/60">
                  {s.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                  {s.name}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate md:hidden">
                  {[typesEnabled ? typeName : null, t(`size_${s.size}`)]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </p>
              </div>
              <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 truncate hidden lg:block">
                {typesEnabled && typeName ? typeName : '—'}
              </span>
              <span className="w-24 flex-shrink-0 text-xs text-on-surface-variant/60 hidden md:block">
                {t(`size_${s.size}`)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
