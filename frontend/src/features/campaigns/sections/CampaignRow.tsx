/**
 * CampaignRow — single row inside the active/archived campaign lists on the
 * CampaignsPage landing view. Renders the campaign title, the viewer's role
 * (GM or Player) and a compact "next session" / "last session" status.
 *
 * Moved verbatim from the old inline CampaignRow in CampaignsPage; internals
 * deliberately unchanged per refactor plan.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions } from '@/features/sessions/api/queries';
import type { CampaignSummary } from '@/entities/campaign';

interface Props {
  campaign: CampaignSummary;
}

export function CampaignRow({ campaign }: Props) {
  const { t, i18n } = useTranslation('campaigns');
  const isArchived = !!campaign.archivedAt;
  const { data: sessions } = useSessions(campaign.id);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const now = new Date();
  const todayStr = now.toDateString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowDate = new Date(todayStart);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toDateString();

  // Nearest upcoming session (today or future)
  const upcoming = [...(sessions ?? [])]
    .filter((s) => s.datetime && new Date(s.datetime) >= todayStart)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const nextSession = upcoming[0] ?? null;

  const sessionDate = nextSession?.datetime ? new Date(nextSession.datetime) : null;
  const isToday = sessionDate && sessionDate.toDateString() === todayStr;
  const isTomorrow = sessionDate && sessionDate.toDateString() === tomorrowStr;

  // Fallback to last session from summary
  const ls = campaign.lastSession;
  const totalSessions = sessions?.length ?? campaign.sessionCount;

  return (
    <Link
      to={`/campaigns/${campaign.id}`}
      className={`group grid grid-cols-[1fr_auto_auto] items-center gap-6 p-5 bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-colors ${isArchived ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      {/* Name + role tag */}
      <div className="min-w-0">
        <p className="text-base font-bold text-on-surface group-hover:text-primary transition-colors truncate">
          {campaign.title}
        </p>
        {campaign.myRole.toUpperCase() === 'GM' ? (
          <p className="flex items-center gap-1 mt-0.5 text-[8px] uppercase tracking-widest text-primary/40">
            <span className="material-symbols-outlined text-[10px]">shield</span>
            {t('common:roles.game_master')}
          </p>
        ) : (
          <p className="flex items-center gap-1 mt-0.5 text-[8px] uppercase tracking-widest text-secondary/40">
            <span className="material-symbols-outlined text-[10px]">person</span>
            {t('common:roles.player')}
          </p>
        )}
      </div>

      {/* Session info */}
      <div className="flex items-center gap-3 justify-end">
        {nextSession ? (
          <>
            {isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[8px] font-bold uppercase tracking-wider border border-primary/30">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                {t('session_badge.today')}
              </span>
            )}
            {isTomorrow && !isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[8px] font-bold uppercase tracking-wider border border-secondary/20">
                <span className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
                {t('session_badge.tomorrow')}
              </span>
            )}
            {!isToday && !isTomorrow && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[8px] font-bold uppercase tracking-wider border border-secondary/20">
                {t('session_badge.next')}
              </span>
            )}
            <span className="text-[10px] font-label uppercase tracking-widest text-primary/60 flex-shrink-0">
              #{String(nextSession.number).padStart(2, '0')}
            </span>
            {sessionDate && (
              <span className="text-[10px] text-on-surface-variant/40 flex-shrink-0">{formatDate(nextSession.datetime)}</span>
            )}
          </>
        ) : ls ? (
          <>
            <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/30 flex-shrink-0">
              #{String(totalSessions).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-on-surface-variant/30 flex-shrink-0">{formatDate(ls.datetime)}</span>
          </>
        ) : (
          <span className="text-xs text-on-surface-variant/30 italic">{t('no_sessions')}</span>
        )}
      </div>

      {/* Arrow */}
      <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary/60 transition-colors">
        chevron_right
      </span>
    </Link>
  );
}
