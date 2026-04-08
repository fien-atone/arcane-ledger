/**
 * SessionListSection — main list card for SessionListPage.
 *
 * Renders loading / error / empty states and, once loaded, a date-sorted
 * table of session rows with the session number, title, date column, and an
 * optional Today / Tomorrow / Next / Previous status badge.
 *
 * Presentational: receives the already-filtered list, formatter, and badge
 * resolver from useSessionListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import type { Session } from '@/entities/session';
import type { SessionBadge } from '../hooks/useSessionListPage';

interface Props {
  campaignId: string;
  isLoading: boolean;
  isError: boolean;
  filtered: Session[];
  formatDate: (iso: string) => string;
  getBadge: (session: Pick<Session, 'id' | 'datetime'>) => SessionBadge | null;
}

export function SessionListSection({
  campaignId,
  isLoading,
  isError,
  filtered,
  formatDate,
  getBadge,
}: Props) {
  const { t } = useTranslation('sessions');

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
        icon="auto_stories"
        title={t('empty_title')}
        subtitle={t('empty_subtitle')}
      />
    );
  }

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
        <span className="w-10 flex-shrink-0">{t('column_number')}</span>
        <span className="flex-1 min-w-0">{t('column_title')}</span>
        <span className="w-28 flex-shrink-0 hidden sm:block">
          {t('column_date')}
        </span>
        <span className="w-24 flex-shrink-0" />
      </div>
      {filtered.map((session) => {
        const badge = getBadge(session);
        return (
          <Link
            key={session.id}
            to={`/campaigns/${campaignId}/sessions/${session.id}`}
            className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center bg-surface-container-highest border border-outline-variant/20">
                <span
                  className={`font-headline text-sm font-bold italic ${
                    badge ? 'text-primary/70' : 'text-on-surface-variant/50'
                  }`}
                >
                  {String(session.number).padStart(2, '0')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                  {session.title}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate sm:hidden">
                  {session.datetime ? formatDate(session.datetime) : t('date_tbd')}
                </p>
              </div>
              <span className="w-28 flex-shrink-0 text-xs text-on-surface-variant/60 hidden sm:block">
                {session.datetime ? formatDate(session.datetime) : t('date_tbd')}
              </span>
              <span className="w-24 flex-shrink-0 flex justify-end">
                {badge && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${badge.cls}`}
                  >
                    {badge.pulse && (
                      <span
                        className={`w-1 h-1 rounded-full ${badge.dotCls} animate-pulse`}
                      />
                    )}
                    {badge.label}
                  </span>
                )}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
