/**
 * DashboardRecentSessionsSection — list of the 5 most recent sessions
 * (by session number, descending), excluding the "next session" to avoid
 * duplication with DashboardNextSessionSection.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSessions } from '@/features/sessions/api/queries';

interface Props {
  campaignId: string;
}

export function DashboardRecentSessionsSection({ campaignId }: Props) {
  const { t, i18n } = useTranslation('campaigns');
  const { data: sessions } = useSessions(campaignId);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(
      i18n.language === 'ru' ? 'ru-RU' : 'en-GB',
      { day: 'numeric', month: 'short', year: 'numeric' },
    );

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = [...(sessions ?? [])]
    .filter((s) => s.datetime && new Date(s.datetime) >= todayStart)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const nextSession = upcoming[0] ?? null;

  const sorted = [...(sessions ?? [])].sort((a, b) => b.number - a.number);
  const lastSessions = sorted.filter((s) => s.id !== nextSession?.id).slice(0, 5);

  return (
    <section className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
          {t('dashboard.recent_sessions')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        <Link
          to={`/campaigns/${campaignId}/sessions`}
          className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
        >
          {t('dashboard.all_sessions')}
        </Link>
      </div>
      {lastSessions.length > 0 ? (
        <div className="space-y-2">
          {lastSessions.map((session) => (
            <Link
              key={session.id}
              to={`/campaigns/${campaignId}/sessions/${session.id}`}
              className="group flex items-center gap-4 p-4 bg-surface-container-high border border-outline-variant/15 hover:border-primary/20 rounded-sm transition-colors"
            >
              <div className="w-10 h-10 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/15">
                <span className="font-headline text-sm font-bold italic text-on-surface-variant/50">
                  {String(session.number).padStart(2, '0')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{session.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {session.datetime && (
                    <span className="text-[10px] text-on-surface-variant/40">{formatDate(session.datetime)}</span>
                  )}
                  {session.brief && (
                    <span className="text-[10px] text-on-surface-variant/30 truncate">{session.brief}</span>
                  )}
                </div>
              </div>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-on-surface-variant/40 italic">{t('dashboard.no_sessions_recorded')}</p>
      )}
    </section>
  );
}
