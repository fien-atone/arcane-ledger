import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CampaignCreateDrawer, useCampaigns } from '@/features/campaigns';
import { useSessions } from '@/features/sessions/api/queries';
import { InvitationBanner } from '@/features/invitations/ui/InvitationBanner';
import { SectionBackground } from '@/shared/ui';
import type { CampaignSummary } from '@/entities/campaign';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
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

const CAMPAIGN_COLORS = ['#f2ca50', '#14b8a6', '#a78bfa', '#f87171', '#60a5fa', '#fb923c'];

function GlobalCalendar({ campaigns }: { campaigns: CampaignSummary[] }) {
  const { i18n } = useTranslation('campaigns');
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

export default function CampaignsPage() {
  const { t } = useTranslation('campaigns');
  const { data: campaigns, isLoading, isError } = useCampaigns();
  const [createOpen, setCreateOpen] = useState(false);

  const active = (campaigns ?? [])
    .filter((c) => !c.archivedAt)
    .sort((a, b) => {
      const aGm = a.myRole.toUpperCase() === 'GM' ? 0 : 1;
      const bGm = b.myRole.toUpperCase() === 'GM' ? 0 : 1;
      if (aGm !== bGm) return aGm - bGm;
      return a.title.localeCompare(b.title);
    });
  const archived = (campaigns ?? []).filter((c) => !!c.archivedAt);

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
      <div className="px-4 sm:px-8 pt-16 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex items-baseline justify-between">
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
              {t('my_campaigns')}
            </h1>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              {t('create_campaign')}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 text-on-surface-variant p-12">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            {t('loading')}
          </div>
        )}

        {isError && (
          <p className="text-tertiary text-sm p-12">{t('failed_to_load')}</p>
        )}

        {campaigns && campaigns.length === 0 && (
          <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
            <div className="text-center py-16 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">auto_stories</span>
              <p className="font-headline text-2xl text-on-surface-variant">{t('no_campaigns_title')}</p>
              <p className="text-on-surface-variant/50 text-sm">{t('no_campaigns_desc')}</p>
            </div>
          </div>
        )}

        {/* Pending invitations */}
        <InvitationBanner />

        {/* Two-column layout: campaigns + calendar */}
        {campaigns && campaigns.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column — campaign lists */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Active campaigns (GM first, then Player) */}
              {active.length > 0 && (
                <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t('common:active')}</h3>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    <span className="text-[10px] text-on-surface-variant/30">{active.length}</span>
                  </div>
                  <div className="space-y-3">
                    {active.map((c) => <CampaignRow key={c.id} campaign={c} />)}
                  </div>
                </div>
              )}

              {/* Archived campaigns */}
              {archived.length > 0 && (
                <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/40">{t('common:archive')}</h3>
                    <div className="h-px flex-1 bg-outline-variant/10" />
                    <span className="text-[10px] text-on-surface-variant/30">{archived.length}</span>
                  </div>
                  <div className="space-y-3">
                    {archived.map((c) => <CampaignRow key={c.id} campaign={c} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Right column — calendar */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <GlobalCalendar campaigns={campaigns} />
            </div>
          </div>
        )}
      </div>
    </main>

    <CampaignCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
