/**
 * CampaignsCalendarSection — cross-campaign month calendar shown on the
 * landing /campaigns page. Pulls sessions from up to four active campaigns
 * (that have the Sessions section enabled) and renders colored day cells
 * with a multi-session expandable popover.
 *
 * Distinct from DashboardCalendarSection (which is single-campaign, part
 * of CampaignDashboardPage). Moved verbatim from the old inline
 * GlobalCalendar component in CampaignsPage; internals deliberately
 * unchanged per refactor plan.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions } from '@/features/sessions/api/queries';
import { getWeekdays } from '@/shared/lib/weekdays';
import type { CampaignSummary } from '@/entities/campaign';

const CAMPAIGN_COLORS = ['#f2ca50', '#14b8a6', '#a78bfa', '#f87171', '#60a5fa', '#fb923c'];

interface Props {
  campaigns: CampaignSummary[];
}

export function CampaignsCalendarSection({ campaigns }: Props) {
  const { i18n } = useTranslation('campaigns');
  const calLocale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
  const WEEKDAYS = useMemo(() => getWeekdays(calLocale), [calLocale]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const activeCampaigns = campaigns.filter((c) => !c.archivedAt);
  // Only include campaigns with sessions enabled (empty array = all enabled)
  const sessionsEnabledCampaigns = activeCampaigns.filter((c) =>
    !c.enabledSections || c.enabledSections.length === 0 || c.enabledSections.some((s) => s.toUpperCase() === 'SESSIONS')
  );
  const campaignIds = sessionsEnabledCampaigns.map((c) => c.id);
  const campaignColorMap = useMemo(() => new Map(campaignIds.map((id, i) => [id, CAMPAIGN_COLORS[i % CAMPAIGN_COLORS.length]])), [campaignIds]);
  const s0 = useSessions(campaignIds[0] ?? '');
  const s1 = useSessions(campaignIds[1] ?? '');
  const s2 = useSessions(campaignIds[2] ?? '');
  const s3 = useSessions(campaignIds[3] ?? '');

  const allSessions = useMemo(() => {
    const arr = [s0.data, s1.data, s2.data, s3.data];
    return arr.flatMap((d, i) =>
      (d ?? []).map((s) => ({ ...s, campaignId: campaignIds[i], campaignTitle: campaigns.find((c) => c.id === campaignIds[i])?.title ?? '' }))
    );
  }, [s0.data, s1.data, s2.data, s3.data, campaignIds, campaigns]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof allSessions[number][]>();
    for (const s of allSessions) {
      if (!s.datetime) continue;
      const d = new Date(s.datetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [allSessions]);

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = (() => { const d = new Date(viewYear, viewMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-5 sticky top-8">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        <span className="text-xs font-label font-bold uppercase tracking-widest text-on-surface">{monthLabel}</span>
        <button type="button" onClick={nextMonth} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd, i) => (
          <div key={wd} className={`text-center text-[8px] font-bold uppercase tracking-wider py-1 ${i >= 5 ? 'text-primary/40' : 'text-on-surface-variant/30'}`}>
            {wd}
          </div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const key = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const daySessions = sessionsByDate.get(key);
          const isToday = key === todayKey;
          const dayOfWeek = (startDay + i) % 7;
          const isWeekend = dayOfWeek >= 5;
          const base = 'h-8 flex flex-col items-center justify-center rounded-sm text-[11px] transition-all';

          if (daySessions && daySessions.length > 0) {
            const first = daySessions[0];
            const color = campaignColorMap.get(first.campaignId) ?? '#f2ca50';
            const isExpanded = expandedDay === key;

            // Single session — direct link
            if (daySessions.length === 1) {
              return (
                <Link
                  key={day}
                  to={`/campaigns/${first.campaignId}/sessions/${first.id}`}
                  title={`${first.campaignTitle} #${first.number}`}
                  className={`${base} font-bold hover:opacity-80`}
                  style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}50` }}
                >
                  {day}
                </Link>
              );
            }

            // Multiple sessions — expandable
            return (
              <div key={day} className="relative">
                <button
                  type="button"
                  onClick={() => setExpandedDay(isExpanded ? null : key)}
                  className={`${base} w-full font-bold hover:opacity-80`}
                  style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}50` }}
                >
                  <span>{day}</span>
                  <div className="flex gap-px mt-px">
                    {daySessions.map((s, si) => (
                      <span key={si} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: campaignColorMap.get(s.campaignId) ?? '#f2ca50' }} />
                    ))}
                  </div>
                </button>
                {isExpanded && (
                  <div className="absolute z-50 top-full mt-1 left-1/2 -translate-x-1/2 w-48 bg-surface-container border border-outline-variant/20 rounded-sm shadow-xl py-1">
                    {daySessions.map((s) => {
                      const sColor = campaignColorMap.get(s.campaignId) ?? '#f2ca50';
                      return (
                        <Link
                          key={s.id}
                          to={`/campaigns/${s.campaignId}/sessions/${s.id}`}
                          onClick={() => setExpandedDay(null)}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-container-high transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sColor }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-on-surface truncate">#{s.number} {s.title}</p>
                            <p className="text-[8px] text-on-surface-variant/50 truncate">{s.campaignTitle}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={day} className={`${base} ${isToday ? 'bg-secondary/10 text-secondary font-bold border border-secondary/30' : isWeekend ? 'text-on-surface-variant/25' : 'text-on-surface-variant/40'}`}>
              {day}
            </div>
          );
        })}
      </div>
      {sessionsEnabledCampaigns.length > 1 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-outline-variant/10">
          {sessionsEnabledCampaigns.map((c) => {
            const color = campaignColorMap.get(c.id) ?? '#f2ca50';
            return (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] text-on-surface-variant/60 truncate max-w-[100px]">{c.title}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
