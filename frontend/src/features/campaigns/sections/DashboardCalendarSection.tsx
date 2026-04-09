/**
 * DashboardCalendarSection — month calendar highlighting days that have a
 * scheduled session. Moved verbatim from the old inline SessionCalendar
 * component in CampaignDashboardPage; internals deliberately unchanged
 * per refactor plan.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions } from '@/features/sessions/api/queries';
import { getWeekdays } from '@/shared/lib/weekdays';
import { SectionPanel } from '@/shared/ui';

interface Props {
  campaignId: string;
}

export function DashboardCalendarSection({ campaignId }: Props) {
  const { t, i18n } = useTranslation('campaigns');
  const { data: sessionsData } = useSessions(campaignId);
  const sessions = sessionsData ?? [];
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
  const WEEKDAYS = useMemo(() => getWeekdays(locale), [locale]);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Map date string -> session
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, (typeof sessions)[number]>();
    for (const s of sessions) {
      if (!s.datetime) continue;
      const d = new Date(s.datetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, s);
    }
    return map;
  }, [sessions]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = (() => { const d = new Date(viewYear, viewMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  return (
    <SectionPanel title={t('dashboard.calendar')}>
      <div className="space-y-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={prevMonth} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <span className="text-xs font-label font-bold uppercase tracking-widest text-on-surface">{monthLabel}</span>
          <button type="button" onClick={nextMonth} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((wd, i) => (
            <div key={wd} className={`text-center text-[8px] font-bold uppercase tracking-wider py-0.5 ${i >= 5 ? 'text-primary/40' : 'text-on-surface-variant/30'}`}>
              {wd}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const session = sessionsByDate.get(key);
            const isToday = key === todayKey;
            const dayOfWeek = (startDay + i) % 7;
            const isWeekend = dayOfWeek >= 5;

            const base = 'h-7 flex items-center justify-center rounded-sm text-[11px] transition-all';

            if (session) {
              return (
                <Link
                  key={day}
                  to={`/campaigns/${campaignId}/sessions/${session.id}`}
                  title={`#${session.number} ${session.title}`}
                  className={`${base} bg-primary/15 text-primary font-bold border border-primary/30 hover:bg-primary/25`}
                >
                  {day}
                </Link>
              );
            }

            return (
              <div
                key={day}
                className={`${base} ${
                  isToday
                    ? 'bg-secondary/10 text-secondary font-bold border border-secondary/30'
                    : isWeekend
                      ? 'text-on-surface-variant/30'
                      : 'text-on-surface-variant/50'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </SectionPanel>
  );
}
