/**
 * DashboardActiveQuestsSection — list of up to 5 active quests with a
 * link to the full quests page.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuests } from '@/features/quests/api';

interface Props {
  campaignId: string;
}

export function DashboardActiveQuestsSection({ campaignId }: Props) {
  const { t } = useTranslation('campaigns');
  const { data: allQuests } = useQuests(campaignId);
  const activeQuests = (allQuests ?? []).filter((q) => q.status === 'active');

  return (
    <section className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
          {t('dashboard.active_quests')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        <Link
          to={`/campaigns/${campaignId}/quests`}
          className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
        >
          {t('dashboard.all_quests')}
        </Link>
      </div>
      {activeQuests && activeQuests.length > 0 ? (
        <div className="space-y-2">
          {activeQuests.slice(0, 5).map((quest) => (
            <Link
              key={quest.id}
              to={`/campaigns/${campaignId}/quests/${quest.id}`}
              className="group flex items-center gap-3 p-4 bg-surface-container-high border border-outline-variant/15 hover:border-primary/20 rounded-sm transition-colors"
            >
              <span className="material-symbols-outlined text-secondary/60 text-[18px]">auto_awesome</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{quest.title}</p>
                {quest.description && (
                  <p className="text-[11px] text-on-surface-variant/50 truncate">{quest.description.slice(0, 80)}{quest.description.length > 80 ? '...' : ''}</p>
                )}
              </div>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant/40 italic">{t('dashboard.no_active_quests')}</p>
      )}
    </section>
  );
}
