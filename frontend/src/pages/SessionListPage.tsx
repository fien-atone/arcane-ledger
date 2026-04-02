import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSessions } from '@/features/sessions/api/queries';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { SessionEditDrawer } from '@/features/sessions/ui';
import { LocationIcon, RichContent, EmptyState, SectionDisabled } from '@/shared/ui';
import type { Session } from '@/entities/session';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-3">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">{title}</h3>
      <div className="h-px flex-1 bg-outline-variant/20" />
    </div>
  );
}

function SessionDetail({ session, campaignId }: { session: Session; campaignId: string }) {
  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: allLocations } = useLocations(campaignId);

  const linkedNpcs = (session.npcIds ?? [])
    .map((id) => allNpcs?.find((n) => n.id === id))
    .filter(Boolean) as NonNullable<typeof allNpcs>[number][];

  const linkedLocations = (session.locationIds ?? [])
    .map((id) => allLocations?.find((l) => l.id === id))
    .filter(Boolean) as NonNullable<typeof allLocations>[number][];

  return (
    <div className="flex flex-col overflow-y-auto h-full px-10 py-8">
      <div className="mb-6">
        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{session.title}</h2>
        {session.datetime && (
          <p className="text-xs text-on-surface-variant/50 mt-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            {formatDate(session.datetime)}
          </p>
        )}
      </div>

      {session.brief && (
        <div className="mb-6">
          <SectionHeader title="Brief" />
          <RichContent value={session.brief} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
        </div>
      )}


      {/* NPCs */}
      {npcsEnabled && linkedNpcs.length > 0 && (
        <div className="mb-6">
          <SectionHeader title={`NPCs (${linkedNpcs.length})`} />
          <div className="flex flex-wrap gap-2">
            {linkedNpcs.map((npc) => (
              <Link
                key={npc.id}
                to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-sm text-xs text-on-surface hover:text-primary hover:border-primary/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[13px] !text-on-surface-variant/40">person</span>
                {npc.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {linkedLocations.length > 0 && (
        <div className="mb-6">
          <SectionHeader title={`Locations (${linkedLocations.length})`} />
          <div className="flex flex-wrap gap-2">
            {linkedLocations.map((loc) => (
              <Link
                key={loc.id}
                to={`/campaigns/${campaignId}/locations/${loc.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container border border-outline-variant/20 rounded-sm text-xs text-on-surface hover:text-primary hover:border-primary/30 transition-colors"
              >
                <LocationIcon locationType={loc.type} size="text-[13px]" generic={!locationTypesEnabled} />
                {loc.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My Notes preview */}
      {session.myNote?.content && (
        <div className="mb-6">
          <SectionHeader title="My Notes" />
          <div className="border-l-2 border-secondary/30 pl-3">
            <RichContent
              value={session.myNote.content}
              className="prose-p:text-sm prose-p:text-on-surface-variant/70 prose-p:leading-relaxed line-clamp-3"
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default function SessionListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const sessionsEnabled = useSectionEnabled(campaignId ?? '', 'sessions');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  if (!sessionsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const filtered = sessions?.filter((s) =>
    !search ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.brief?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const selected = sessions?.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Sessions</h1>
            <p className="text-on-surface-variant text-sm mt-1">Chronicle of all gathered sessions, newest first.</p>
          </div>
          {isGm && (
            <button
              onClick={() => setAddOpen(true)}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">New Session</span>
            </button>
          )}
        </div>
      </header>

      {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…</div>}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load sessions.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            <div className="p-4 border-b border-outline-variant/10 flex-shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search sessions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {filtered.length === 0 && (
                <EmptyState icon="auto_stories" title="No sessions found." subtitle="Log your first session to begin." />
              )}
              {(() => {
                const now = new Date();
                const todayStr = now.toDateString();
                const tomorrowDate = new Date(now);
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                const tomorrowStr = tomorrowDate.toDateString();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                // Future sessions (from tomorrow onwards), sorted ascending
                const futureStart = new Date(todayStart);
                futureStart.setDate(futureStart.getDate() + 1);
                const futureSessions = [...filtered]
                  .filter((s) => s.datetime && new Date(s.datetime) >= futureStart)
                  .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
                const nextSessionId = futureSessions[0]?.id ?? null;

                // Most recent past (before today)
                const pastSessions = filtered.filter((s) => s.datetime && new Date(s.datetime) < todayStart);
                const lastSessionId = pastSessions.length > 0 ? pastSessions[0]?.id : null;

                return filtered.map((session) => {
                  const isSelected = selected?.id === session.id;
                  const sessionDate = session.datetime ? new Date(session.datetime) : null;
                  const isToday = sessionDate && sessionDate.toDateString() === todayStr;
                  const isTomorrow = sessionDate && sessionDate.toDateString() === tomorrowStr;
                  const isNext = session.id === nextSessionId && !isToday && !isTomorrow;
                  const isLast = session.id === lastSessionId;

                  let badge: { label: string; cls: string; pulse?: boolean } | null = null;
                  if (isToday) {
                    badge = { label: 'Today', cls: 'bg-primary/15 text-primary border-primary/30', pulse: true };
                  } else if (isTomorrow) {
                    badge = { label: 'Tomorrow', cls: 'bg-secondary/10 text-secondary border-secondary/20', pulse: true };
                  } else if (isNext) {
                    badge = { label: 'Next', cls: 'bg-secondary/10 text-secondary border-secondary/20' };
                  } else if (isLast) {
                    badge = { label: 'Previous', cls: 'bg-primary/10 text-primary border-primary/20' };
                  }

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedId(session.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                        isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${isSelected ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                        <span className={`font-headline text-sm font-bold italic ${isSelected ? 'text-primary' : badge ? 'text-primary/70' : 'text-on-surface-variant/50'}`}>
                          {String(session.number).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate transition-colors ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>{session.title}</p>
                        <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>{session.datetime ? formatDate(session.datetime) : 'Date TBD'}</p>
                      </div>
                      {badge && (
                        <span className={`flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${badge.cls}`}>
                          {badge.pulse && <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-primary' : 'bg-secondary'} animate-pulse`} />}
                          {badge.label}
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>

            {sessions && sessions.length > 0 && (
              <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
                <p className="text-[10px] text-on-surface-variant/40">
                  <span className="text-primary font-bold">{filtered.length}</span>
                  <span className="text-on-surface-variant/30"> of </span>
                  <span className="text-primary font-bold">{sessions.length}</span> sessions
                </p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <SessionDetail session={selected} campaignId={campaignId ?? ''} />
                <Link
                  to={`/campaigns/${campaignId}/sessions/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">Select a session</div>
            )}
          </div>
        </div>
      )}

      <SessionEditDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        campaignId={campaignId ?? ''}
      />
    </main>
  );
}
