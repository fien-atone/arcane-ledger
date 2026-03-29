import { useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCampaign, useSaveCampaign } from '@/features/campaigns/api/queries';
import { useSessions } from '@/features/sessions/api/queries';
import { useQuests } from '@/features/quests/api';
import { useParty } from '@/features/characters/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { useGroups } from '@/features/groups/api';
import { InlineRichField } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { CampaignSummary } from '@/entities/campaign';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function SessionCalendar({ sessions, campaignId }: { sessions: { id: string; number: number; title: string; datetime: string }[]; campaignId: string }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Map date string → session
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

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = (() => { const d = new Date(viewYear, viewMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  return (
    <section>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
          Calendar
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>
      <div className="bg-surface-container-low border border-outline-variant/10 rounded-sm p-4 space-y-3">
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
  const { id } = useParams<{ id: string }>();
  const campaignId = id ?? '';

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
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

  const saveDescription = useCallback((html: string) => {
    if (!campaign) return;
    saveCampaign.mutate({ ...campaign as CampaignSummary, description: html || undefined });
  }, [campaign, saveCampaign]);

  if (campaignLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-3">progress_activity</span>
        Loading campaign…
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-12 text-on-surface-variant">Campaign not found.</div>;
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

  // Recent NPCs (last 5 updated)
  const recentNpcs = [...(allNpcs ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);


  return (
    <div className="flex-1 min-h-screen bg-surface overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-10 py-10 pb-20">

        {/* Campaign header */}
        <header className="mb-8">
          <div className="flex items-center justify-end mb-2">
            {confirmArchive ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-outline-variant/20 bg-surface-container rounded-sm">
                <span className="text-[10px] text-on-surface-variant">
                  {campaign.archivedAt ? 'Restore this campaign?' : 'Archive this campaign?'}
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
                  Yes
                </button>
                <button
                  onClick={() => setConfirmArchive(false)}
                  className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmArchive(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-on-surface-variant/40 text-[10px] font-label uppercase tracking-widest rounded-sm hover:border-outline-variant/40 hover:text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {campaign.archivedAt ? 'unarchive' : 'archive'}
                </span>
                {campaign.archivedAt ? 'Restore' : 'Archive'}
              </button>
            )}
          </div>
          {editingTitle ? (
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
                className="p-2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ) : (
            <h1
              className="font-headline text-5xl lg:text-6xl font-bold text-on-surface mb-2 cursor-pointer hover:text-primary/80 transition-colors group"
              onClick={() => { setTitleDraft(campaign.title); setEditingTitle(true); }}
              title="Click to edit"
            >
              {campaign.title}
              <span className="material-symbols-outlined text-lg text-on-surface-variant/0 group-hover:text-primary/40 transition-colors ml-3 align-middle">edit</span>
            </h1>
          )}
          <div>
            <InlineRichField
              label=""
              value={campaign.description}
              onSave={saveDescription}
              placeholder="Campaign description…"
            />
          </div>
        </header>

        {/* Quick Nav */}
        <div className="grid grid-cols-6 gap-3 mb-8 pb-8 border-b border-outline-variant/10">
          {[
            { label: 'Sessions', count: String(sessionCount), icon: 'auto_stories', to: 'sessions' },
            { label: 'NPCs', count: String(npcCount), icon: 'person', to: 'npcs' },
            { label: 'Locations', count: String(locationCount), icon: 'location_on', to: 'locations' },
            { label: 'Groups', count: String(groupCount), icon: 'groups', to: 'groups' },
            { label: 'Quests', count: `${questActiveCount}/${questTotal}`, sub: 'active', icon: 'auto_awesome', to: 'quests' },
            { label: 'Social Graph', icon: 'hub', to: 'npcs/relationships' },
          ].map(({ label, count, sub, icon, to }) => (
            <Link
              key={to}
              to={`/campaigns/${campaignId}/${to}`}
              className="group flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 hover:border-primary/30 hover:bg-primary/8 rounded-sm transition-colors"
            >
              <span className="material-symbols-outlined text-primary/30 group-hover:text-primary/60 transition-colors text-xl">{icon}</span>
              <div>
                {count && <p className="text-xl font-bold text-primary leading-none">{count}</p>}
                <p className={`text-[9px] font-label uppercase tracking-widest text-primary/50 ${!count ? 'text-[10px]' : ''}`}>{label}{sub && <span className="text-primary/30 ml-1">{sub}</span>}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">

          {/* ── Left column (8/12) ─────────────────────────── */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Next Session */}
            {(() => {
              if (!nextSession) {
                return (
                  <Link
                    to={`/campaigns/${campaignId}/sessions`}
                    className="group flex items-center gap-4 p-5 bg-surface-container-low border border-dashed border-outline-variant/20 hover:border-primary/30 rounded-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary transition-colors text-xl">add</span>
                    <div className="flex-1">
                      <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 group-hover:text-primary transition-colors">No upcoming session</p>
                      <p className="text-sm text-on-surface-variant/40 group-hover:text-on-surface transition-colors">Schedule the next session →</p>
                    </div>
                  </Link>
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
                whenLabel = 'Session Today!';
                const h = sessionDate!.getHours();
                const m = sessionDate!.getMinutes();
                if (h !== 0 || m !== 0) {
                  whenDetail = `Starts at ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                }
              } else if (isTomorrow) {
                whenLabel = 'Session Tomorrow';
                const h = sessionDate!.getHours();
                const m = sessionDate!.getMinutes();
                if (h !== 0 || m !== 0) {
                  whenDetail = `Starts at ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                }
              } else {
                whenLabel = 'Next Session';
                if (sessionDate) whenDetail = formatDate(nextSession.datetime);
              }

              const bgCls = isToday ? 'bg-primary/8 border-primary/30 hover:bg-primary/12' : 'bg-secondary/5 border-secondary/20 hover:bg-secondary/10';
              const textCls = isToday ? 'text-primary' : 'text-secondary';

              return (
                <Link
                  to={`/campaigns/${campaignId}/sessions/${nextSession.id}`}
                  className={`group flex items-center gap-4 p-5 border rounded-sm transition-colors ${bgCls}`}
                >
                  <span className={`material-symbols-outlined text-xl ${textCls}`}>
                    {isToday ? 'notifications_active' : 'event'}
                  </span>
                  <div className="flex-1">
                    <p className={`text-[10px] font-label uppercase tracking-widest font-bold ${textCls}`}>
                      {whenLabel}
                    </p>
                    <p className={`text-sm text-on-surface group-hover:${textCls} transition-colors`}>
                      #{String(nextSession.number).padStart(2, '0')} — {nextSession.title}
                      {whenDetail && <span className="text-on-surface-variant/50 ml-2">{whenDetail}</span>}
                    </p>
                  </div>
                  <span className={`material-symbols-outlined ${textCls}/40 group-hover:${textCls} transition-colors`}>arrow_forward</span>
                </Link>
              );
            })()}

            {/* Recent Sessions */}
            <section>
              <div className="flex items-center gap-4 mb-5">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Recent Sessions
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                <Link
                  to={`/campaigns/${campaignId}/sessions`}
                  className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  All sessions →
                </Link>
              </div>
              {lastSessions.length > 0 ? (
                <div className="space-y-2">
                  {lastSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/campaigns/${campaignId}/sessions/${session.id}`}
                      className="group flex items-center gap-4 p-4 bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-colors"
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
                <p className="text-xs text-on-surface-variant/40 italic">No sessions recorded yet.</p>
              )}
            </section>

            {/* Active Quests */}
            <section>
              <div className="flex items-center gap-4 mb-5">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Active Quests
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                <Link
                  to={`/campaigns/${campaignId}/quests`}
                  className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  All quests →
                </Link>
              </div>
              {activeQuests && activeQuests.length > 0 ? (
                <div className="space-y-2">
                  {activeQuests.slice(0, 5).map((quest) => (
                    <Link
                      key={quest.id}
                      to={`/campaigns/${campaignId}/quests/${quest.id}`}
                      className="group flex items-center gap-3 p-4 bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-secondary/60 text-[18px]">auto_awesome</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{quest.title}</p>
                        {quest.description && (
                          <p className="text-[11px] text-on-surface-variant/50 truncate">{quest.description.slice(0, 80)}{quest.description.length > 80 ? '…' : ''}</p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/40 italic">No active quests.</p>
              )}
            </section>

          </div>

          {/* ── Right column (4/12) ────────────────────────── */}
          <div className="col-span-12 lg:col-span-4 space-y-8">

            {/* Session Calendar */}
            <SessionCalendar sessions={sessions ?? []} campaignId={campaignId} />

            {/* The Party */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  The Party
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                <Link
                  to={`/campaigns/${campaignId}/party`}
                  className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                >
                  Manage →
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
                        className="group flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-colors"
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
                            {[character.species, character.class].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant/40 italic">No characters yet.</p>
              )}
            </section>

            {/* Recently Updated NPCs */}
            {recentNpcs.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Recent NPCs
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                  <Link
                    to={`/campaigns/${campaignId}/npcs`}
                    className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    All →
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentNpcs.map((npc) => {
                    const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                    return (
                      <Link
                        key={npc.id}
                        to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                        className="group flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                          {npc.image ? (
                            <img src={resolveImageUrl(npc.image)} alt={npc.name} className="w-full h-full object-cover rounded-sm" />
                          ) : (
                            <span className="text-[10px] font-bold text-on-surface-variant/60">{initials}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{npc.name}</p>
                          <p className="text-[10px] text-on-surface-variant/40">{npc.species ?? npc.status}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
