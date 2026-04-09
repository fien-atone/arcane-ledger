/**
 * DashboardNextSessionSection — card showing the nearest upcoming session,
 * or an empty-state prompting the GM to schedule one.
 *
 * Fetches its own session list. Computes the next session (today or future,
 * earliest first) and renders "today"/"tomorrow"/date labels accordingly.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSessions } from '@/features/sessions/api/queries';
import { SectionPanel } from '@/shared/ui';

interface Props {
  campaignId: string;
}

export function DashboardNextSessionSection({ campaignId }: Props) {
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

  if (!nextSession) {
    return (
      <SectionPanel title={t('dashboard.next_session')}>
        <Link
          to={`/campaigns/${campaignId}/sessions`}
          className="group flex items-center gap-4 p-5 bg-surface-container-high border border-dashed border-outline-variant/20 hover:border-primary/30 rounded-sm transition-colors"
        >
          <span className="material-symbols-outlined text-on-surface-variant/50 group-hover:text-primary transition-colors text-xl">add</span>
          <div className="flex-1">
            <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">{t('dashboard.no_upcoming_session')}</p>
            <p className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">{t('dashboard.schedule_next_session')}</p>
          </div>
        </Link>
      </SectionPanel>
    );
  }

  const sessionDate = nextSession.datetime ? new Date(nextSession.datetime) : null;
  const today = new Date();
  const todayStr = today.toDateString();
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toDateString();

  const isToday = sessionDate && sessionDate.toDateString() === todayStr;
  const isTomorrow = sessionDate && sessionDate.toDateString() === tomorrowStr;

  let whenLabel = '';
  let whenDetail = '';
  if (isToday) {
    whenLabel = t('dashboard.session_today');
    const h = sessionDate!.getHours();
    const m = sessionDate!.getMinutes();
    if (h !== 0 || m !== 0) {
      whenDetail = `${t('dashboard.starts_at')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  } else if (isTomorrow) {
    whenLabel = t('dashboard.session_tomorrow');
    const h = sessionDate!.getHours();
    const m = sessionDate!.getMinutes();
    if (h !== 0 || m !== 0) {
      whenDetail = `${t('dashboard.starts_at')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  } else {
    whenLabel = t('dashboard.next_session');
    if (sessionDate) whenDetail = formatDate(nextSession.datetime);
  }

  const accentCls = isToday ? 'border-l-primary' : 'border-l-secondary';
  const textCls = isToday ? 'text-primary' : 'text-secondary';

  return (
    <SectionPanel title={t('dashboard.next_session')}>
      <Link
        to={`/campaigns/${campaignId}/sessions/${nextSession.id}`}
        className={`group flex items-center gap-4 p-5 bg-surface-container-high border border-outline-variant/15 border-l-2 ${accentCls} hover:border-outline-variant/30 rounded-sm transition-colors`}
      >
        <span className={`material-symbols-outlined text-xl ${textCls}`}>
          {isToday ? 'notifications_active' : 'event'}
        </span>
        <div className="flex-1">
          <p className={`text-[10px] font-label uppercase tracking-widest font-bold ${textCls}`}>
            {whenLabel}
          </p>
          <p className="text-sm text-on-surface group-hover:text-primary transition-colors">
            #{String(nextSession.number).padStart(2, '0')} — {nextSession.title}
            {whenDetail && <span className="text-on-surface-variant/50 ml-2">{whenDetail}</span>}
          </p>
        </div>
        <span className={`material-symbols-outlined ${textCls} opacity-40 group-hover:opacity-100 transition-all`}>arrow_forward</span>
      </Link>
    </SectionPanel>
  );
}
