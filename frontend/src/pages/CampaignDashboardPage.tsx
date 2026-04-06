import { useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCampaign, useSaveCampaign, getEnabledSections } from '@/features/campaigns/api/queries';
import { useSessions } from '@/features/sessions/api/queries';
import { useQuests } from '@/features/quests/api';
import { useParty } from '@/features/characters/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { useGroups } from '@/features/groups/api';
import { InlineRichField, SectionBackground } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { ManageSectionsDrawer } from '@/features/campaigns/ui/ManageSectionsDrawer';
import type { CampaignSummary } from '@/entities/campaign';
import type { CampaignSection } from '@/entities/campaign';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function SessionCalendar({ sessions, campaignId }: { sessions: { id: string; number: number; title: string; datetime: string }[]; campaignId: string }) {
  const { t, i18n } = useTranslation('campaigns');
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Map date string -> session
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, typeof sessions[number]>();
    for (const s of sessions) {
      if (!s.datetime) continue;
      const d = new Date(s.datetime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, s);
    }
    return map;
  }, [sessions]);

  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = (() => { const d = new Date(viewYear, viewMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  return (
    <section className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
          {t('dashboard.calendar')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>
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
    </section>
  );
}

export default function CampaignDashboardPage() {
  const { t, i18n } = useTranslation('campaigns');
  const { id } = useParams<{ id: string }>();
  const campaignId = id ?? '';

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const { data: sessions } = useSessions(campaignId);
  const { data: allQuests } = useQuests(campaignId);
  const { data: party } = useParty(campaignId);
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: allLocations } = useLocations(campaignId);
  const { data: allGroups } = useGroups(campaignId);
  const saveCampaign = useSaveCampaign();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const saveDescription = useCallback((html: string) => {
    if (!campaign) return;
    saveCampaign.mutate({ ...campaign as CampaignSummary, description: html || undefined });
  }, [campaign, saveCampaign]);

  if (campaignLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-3">progress_activity</span>
        {t('dashboard.loading')}
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-12 text-on-surface-variant">{t('dashboard.not_found')}</div>;
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Nearest upcoming: today or future, sorted ascending by date
  const upcoming = [...(sessions ?? [])]
    .filter((s) => s.datetime && new Date(s.datetime) >= todayStart)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const nextSession = upcoming[0] ?? null;
  // Recent sessions: exclude the next session to avoid duplication
  const sorted = [...(sessions ?? [])].sort((a, b) => b.number - a.number);
  const lastSessions = sorted.filter((s) => s.id !== nextSession?.id).slice(0, 5);

  // Stats
  const npcCount = allNpcs?.length ?? 0;
  const locationCount = allLocations?.length ?? 0;
  const groupCount = allGroups?.length ?? 0;
  const sessionCount = sessions?.length ?? 0;
  const activeQuests = (allQuests ?? []).filter((q) => q.status === 'active');
  const questTotal = allQuests?.length ?? 0;
  const questActiveCount = activeQuests.length;



  // Section visibility
  const enabled = getEnabledSections(campaign);
  const enabledSet = new Set(enabled);
  const sectionOn = (s: CampaignSection) => enabledSet.has(s);

  // Quick nav items filtered by enabled sections
  const quickNavItems = [
    { label: t('common:nav_items.sessions'), section: 'sessions' as CampaignSection, count: String(sessionCount), icon: 'auto_stories', to: 'sessions' },
    { label: t('common:nav_items.npcs'), section: 'npcs' as CampaignSection, count: String(npcCount), icon: 'person', to: 'npcs' },
    { label: t('common:nav_items.locations'), section: 'locations' as CampaignSection, count: String(locationCount), icon: 'location_on', to: 'locations' },
    { label: t('common:nav_items.groups'), section: 'groups' as CampaignSection, count: String(groupCount), icon: 'groups', to: 'groups' },
    { label: t('common:nav_items.quests'), section: 'quests' as CampaignSection, count: `${questActiveCount}/${questTotal}`, sub: 'active', icon: 'auto_awesome', to: 'quests' },
    { label: t('common:nav_items.social_graph'), section: 'social_graph' as CampaignSection, icon: 'hub', to: 'npcs/relationships' },
    ...(isGm ? [{ label: t('common:nav_items.species'), section: 'species' as CampaignSection, icon: 'blur_on', to: 'species' }] : []),
  ].filter((item) => enabledSet.has(item.section));


  return (
    <>
    <SectionBackground />
    <div className="flex-1 min-h-screen overflow-y-auto relative z-10">
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to="/campaigns"
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? t('common:campaign')}
        </Link>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">

        {/* Campaign header */}
        <header className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          {isGm && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            <button
              onClick={() => setSectionsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:border-primary/30 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">settings</span>
              {t('common:sections')}
            </button>
            {confirmArchive ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-outline-variant/20 bg-surface-container-high rounded-sm">
                <span className="text-[10px] text-on-surface-variant">
                  {campaign.archivedAt ? t('dashboard.restore_confirm') : t('dashboard.archive_confirm')}
                </span>
                <button
                  onClick={() => {
                    saveCampaign.mutate({
                      ...campaign as CampaignSummary,
                      archivedAt: campaign.archivedAt ? undefined : new Date().toISOString(),
                    });
                    setConfirmArchive(false);
                  }}
                  className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-primary hover:text-on-surface transition-colors"
                >
                  {t('common:yes')}
                </button>
                <button
                  onClick={() => setConfirmArchive(false)}
                  className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {t('common:no')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmArchive(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:border-outline-variant/40 hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {campaign.archivedAt ? 'unarchive' : 'archive'}
                </span>
                {campaign.archivedAt ? t('common:restore') : t('common:archive')}
              </button>
            )}
          </div>
          )}
          {isGm && editingTitle ? (
            <div className="flex items-center gap-3 mb-2">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && titleDraft.trim()) {
                    saveCampaign.mutate({ ...campaign as CampaignSummary, title: titleDraft.trim() });
                    setEditingTitle(false);
                  }
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                className="font-headline text-5xl lg:text-6xl font-bold text-on-surface bg-transparent border-b-2 border-primary/40 focus:border-primary outline-none flex-1 min-w-0"
              />
              <button
                onClick={() => {
                  if (titleDraft.trim()) {
                    saveCampaign.mutate({ ...campaign as CampaignSummary, title: titleDraft.trim() });
                  }
                  setEditingTitle(false);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-sm transition-colors"
              >
                <span className="material-symbols-outlined text-lg">check</span>
              </button>
              <button
                onClick={() => setEditingTitle(false)}
                className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ) : isGm ? (
            <h1
              className="font-headline text-5xl lg:text-6xl font-bold text-on-surface mb-2 cursor-pointer hover:text-primary/80 transition-colors group"
              onClick={() => { setTitleDraft(campaign.title); setEditingTitle(true); }}
              title={t('dashboard.click_to_edit')}
            >
              {campaign.title}
              <span className="material-symbols-outlined text-lg text-on-surface-variant/0 group-hover:text-primary/40 transition-colors ml-3 align-middle">edit</span>
            </h1>
          ) : (
            <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface mb-2">
              {campaign.title}
            </h1>
          )}
          <div>
            <InlineRichField
              label=""
              value={campaign.description}
              onSave={saveDescription}
              placeholder={t('dashboard.description_placeholder')}
            />
          </div>

          {/* Quick Nav */}
          {quickNavItems.length > 0 && (
            <div className="border-t border-outline-variant/10 pt-5 mt-5">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 justify-items-center">
                {quickNavItems.map(({ label, count, icon, to }) => (
                  <Link
                    key={to}
                    to={`/campaigns/${campaignId}/${to}`}
                    className="group flex flex-col items-center gap-1.5 w-full py-3 px-2 bg-surface-container-high border border-outline-variant/15 hover:border-primary/30 hover:bg-surface-container-highest rounded-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-primary/60 group-hover:text-primary transition-colors text-[20px]">{icon}</span>
                    <span className="text-[8px] font-label uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">{label}</span>
                    {count && <span className="text-xs font-bold text-primary">{count}</span>}
                  </Link>
              ))}
            </div>
          </div>
          )}
        </header>

        <div className="grid grid-cols-12 gap-8">

          {/* -- Left column (8/12) -- */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Next Session */}
            {sectionOn('sessions') && (() => {
              if (!nextSession) {
                return (
                  <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                    <div className="flex items-center gap-4 mb-5">
                      <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                        {t('dashboard.next_session')}
                      </h2>
                      <div className="h-px flex-1 bg-outline-variant/20" />
                    </div>
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
                  </div>
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
                <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      {t('dashboard.next_session')}
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
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
                </div>
              );
            })()}

            {/* Recent Sessions */}
            {sectionOn('sessions') && <section className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
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
            </section>}

            {/* Active Quests */}
            {sectionOn('quests') && <section className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
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
            </section>}

          </div>

          {/* -- Right column (4/12) -- */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* Session Calendar */}
            {sectionOn('sessions') && <SessionCalendar sessions={sessions ?? []} campaignId={campaignId} />}

            {/* The Party */}
            {sectionOn('party') && <section className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  {t('dashboard.the_party')}
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                <Link
                  to={`/campaigns/${campaignId}/party`}
                  className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                >
                  {t('dashboard.manage')}
                </Link>
              </div>
              {party && party.length > 0 ? (
                <div className="space-y-2">
                  {party.map((character) => {
                    const initials = character.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                    return (
                      <Link
                        key={character.id}
                        to={`/campaigns/${campaignId}/characters/${character.id}`}
                        className="group flex items-center gap-3 p-3 bg-surface-container-high border border-outline-variant/15 hover:border-primary/20 rounded-sm transition-colors"
                      >
                        <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                          {character.image ? (
                            <img src={resolveImageUrl(character.image)} alt={character.name} className="w-full h-full object-cover rounded-sm" />
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{character.name}</p>
                          <p className="text-[10px] text-on-surface-variant/40 truncate">
                            {[sectionOn('species') ? character.species : null, character.class].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/40 italic">{t('dashboard.no_characters')}</p>
              )}
            </section>}


          </div>
        </div>
      </div>

    </div>

    <ManageSectionsDrawer
      open={sectionsOpen}
      onClose={() => setSectionsOpen(false)}
      campaign={campaign as CampaignSummary}
    />
    </>
  );
}
