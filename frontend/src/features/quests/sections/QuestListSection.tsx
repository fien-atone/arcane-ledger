/**
 * QuestListSection — main list card for QuestListPage.
 *
 * Renders loading / error / empty states and, once loaded, a table of quest
 * rows with status icon, title, status pill column, and (for GMs with the
 * party section enabled) a visibility toggle.
 *
 * Presentational: receives the already-filtered list + handlers from
 * useQuestListPage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/shared/ui';
import type { Quest, QuestStatus } from '@/entities/quest';

const STATUS_STYLE: Record<
  QuestStatus,
  { dot: string; pill: string; icon: string; iconColor: string }
> = {
  active: {
    dot: 'bg-secondary',
    pill: 'bg-secondary/10 text-secondary border border-secondary/20',
    icon: 'bolt',
    iconColor: 'text-secondary',
  },
  completed: {
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    icon: 'check_circle',
    iconColor: 'text-emerald-400',
  },
  failed: {
    dot: 'bg-rose-400',
    pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    icon: 'cancel',
    iconColor: 'text-rose-400',
  },
  unavailable: {
    dot: 'bg-outline-variant',
    pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20',
    icon: 'block',
    iconColor: 'text-on-surface-variant/40',
  },
  undiscovered: {
    dot: 'bg-on-surface-variant/20',
    pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',
    icon: 'visibility_off',
    iconColor: 'text-on-surface-variant/30',
  },
};

interface Props {
  campaignId: string;
  isGm: boolean;
  partyEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
  filtered: Quest[];
  onToggleVisibility: (quest: Quest) => void;
}

export function QuestListSection({
  campaignId,
  isGm,
  partyEnabled,
  isLoading,
  isError,
  filtered,
  onToggleVisibility,
}: Props) {
  const { t } = useTranslation('quests');

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
        icon="map"
        title={t('empty_title')}
        subtitle={t('empty_subtitle')}
      />
    );
  }

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
      {/* Column headers */}
      <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
        <span className="w-10 flex-shrink-0" />
        <span className="flex-1 min-w-0">{t('column_title')}</span>
        <span className="w-24 flex-shrink-0">{t('column_status')}</span>
        {isGm && partyEnabled && <span className="w-8 flex-shrink-0" />}
      </div>
      {filtered.map((quest) => {
        const st = {
          ...STATUS_STYLE[quest.status],
          label: t(`status_${quest.status}`),
        };
        return (
          <Link
            key={quest.id}
            to={`/campaigns/${campaignId}/quests/${quest.id}`}
            className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center bg-surface-container-highest border border-outline-variant/20">
                <span
                  className={`material-symbols-outlined text-[16px] ${st.iconColor}`}
                >
                  {st.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate ${
                    quest.status === 'unavailable'
                      ? 'line-through decoration-on-surface-variant/30'
                      : ''
                  }`}
                >
                  {quest.title}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate sm:hidden">
                  {st.label}
                </p>
              </div>
              <span
                className={`w-24 flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${st.pill}`}
              >
                <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              {isGm && partyEnabled && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleVisibility(quest);
                  }}
                  title={
                    quest.playerVisible
                      ? t('visible_to_players')
                      : t('hidden_from_players')
                  }
                  className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                    quest.playerVisible
                      ? 'text-primary/60 hover:text-primary'
                      : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {quest.playerVisible ? 'visibility' : 'visibility_off'}
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
