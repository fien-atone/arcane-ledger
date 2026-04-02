import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSessions, useSaveSession, useDeleteSession, useSetSessionVisibility, useSessionNote } from '@/features/sessions/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { SESSION_VISIBILITY_FIELDS, SESSION_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { useQuests } from '@/features/quests/api';
import { SessionEditDrawer } from '@/features/sessions/ui';
import { BackLink, LocationIcon, InlineRichField, RichContent, SectionDisabled, VisibilityPanel } from '@/shared/ui';
import type { Session } from '@/entities/session';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { QuestStatus } from '@/entities/quest';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return date;
  return `${date}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const QUEST_STATUS_PILL: Record<QuestStatus, string> = {
  active:      'bg-secondary/10 text-secondary border-secondary/20',
  completed:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed:      'bg-rose-500/10 text-rose-400 border-rose-500/20',
  unavailable: 'bg-surface-container-highest text-on-surface-variant/50 border-outline-variant/20',
  undiscovered: 'bg-surface-variant text-on-surface-variant border-outline-variant/10',
};

function toGoogleCalUrl(title: string, datetime: string, description?: string): string {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3 hours default
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    ...(description ? { details: description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function generateIcs(title: string, datetime: string, description?: string): string {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Arcane Ledger//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${title}`,
    ...(description ? [`DESCRIPTION:${description.replace(/\n/g, '\\n')}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function downloadIcs(title: string, datetime: string, description?: string) {
  const ics = generateIcs(title, datetime, description);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SessionDetailPage() {
  const { id: campaignId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const sessionsEnabled = useSectionEnabled(campaignId ?? '', 'sessions');
  const npcsEnabled = useSectionEnabled(campaignId ?? '', 'npcs');
  const locationsEnabled = useSectionEnabled(campaignId ?? '', 'locations');
  const locationTypesEnabled = useSectionEnabled(campaignId ?? '', 'location_types');
  const questsEnabled = useSectionEnabled(campaignId ?? '', 'quests');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');
  const session = sessions?.find((s) => s.id === sessionId);
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allQuests } = useQuests(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const saveSession = useSaveSession(campaignId ?? '');
  const deleteSession = useDeleteSession(campaignId ?? '');
  const setSessionVisibility = useSetSessionVisibility();
  const sessionNote = useSessionNote(campaignId ?? '');
  const navigate = useNavigate();

  const [npcSearch, setNpcSearch] = useState('');
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');
  const [locSearchOpen, setLocSearchOpen] = useState(false);
  const [questSearch, setQuestSearch] = useState('');
  const [questSearchOpen, setQuestSearchOpen] = useState(false);
  const [confirmRemoveNpcId, setConfirmRemoveNpcId] = useState<string | null>(null);
  const [confirmRemoveLocId, setConfirmRemoveLocId] = useState<string | null>(null);
  const [confirmRemoveQuestId, setConfirmRemoveQuestId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [calMenuOpen, setCalMenuOpen] = useState(false);

  const saveField = useCallback((field: keyof Session, html: string) => {
    if (!session) return;
    saveSession.mutate({ ...session, [field]: html || undefined });
  }, [session, saveSession]);

  if (!sessionsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !session) {
    return (
      <main className="p-12">
        <BackLink to={`/campaigns/${campaignId}/sessions`}>Sessions</BackLink>
        <p className="text-tertiary text-sm">Session not found.</p>
      </main>
    );
  }

  // Prev / next navigation
  const sorted = [...(sessions ?? [])].sort((a, b) => b.number - a.number);
  const idx = sorted.findIndex((s) => s.id === sessionId);
  const prevSession = sorted[idx + 1];
  const nextSession = sorted[idx - 1];

  return (
    <main className="flex-1 min-h-screen bg-surface">
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/sessions`}>All Sessions</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Session header */}
            <header className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">
                  Session #{String(session.number).padStart(2, '0')}
                </span>
                <div className="h-px w-12 bg-outline-variant/30" />
                {session.datetime && (
                  <span className="text-sm text-on-surface-variant/60">
                    {formatDateTime(session.datetime)}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  {/* Add to Calendar */}
                  {session.datetime && (
                    <div className="relative">
                      <button
                        onClick={() => setCalMenuOpen((v) => !v)}
                        className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-on-surface-variant text-xs font-label uppercase tracking-widest rounded-sm hover:text-primary hover:border-primary/30 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                        Calendar
                      </button>
                      {calMenuOpen && (
                        <div className="absolute z-50 top-full mt-1 right-0 w-48 bg-surface-container border border-outline-variant/20 rounded-sm shadow-xl py-1">
                          <a
                            href={toGoogleCalUrl(`${campaign?.title ? campaign.title + ' — ' : ''}Session #${session.number}`, session.datetime, session.brief)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setCalMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-high transition-colors text-xs text-on-surface"
                          >
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">event</span>
                            Google Calendar
                          </a>
                          <button
                            onClick={() => { downloadIcs(`${campaign?.title ? campaign.title + ' — ' : ''}Session #${session.number}`, session.datetime, session.brief); setCalMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-container-high transition-colors text-xs text-on-surface text-left"
                          >
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/60">download</span>
                            Apple / Outlook (.ics)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {isGm && (
                    <>
                      {confirmDelete ? (
                        <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
                          <span className="text-[10px] text-on-surface-variant">Delete this session?</span>
                          <button
                            onClick={() => deleteSession.mutate(session.id, { onSuccess: () => navigate(`/campaigns/${campaignId}/sessions`) })}
                            className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-on-surface-variant/40 text-xs font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      )}
                      <button
                        onClick={() => setEditOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h1 className="font-headline text-5xl font-bold text-on-surface tracking-tight leading-tight">
                {session.title}
              </h1>
            </header>

            {/* Brief — editable for GM, read-only for players */}
            {isGm ? (
              <InlineRichField
                label="Brief"
                value={session.brief}
                onSave={(html) => saveField('brief', html)}
                placeholder="Public session brief — what the players know…"
              />
            ) : session.brief ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">Brief</h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <RichContent value={session.brief} className="prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1" />
              </div>
            ) : null}

            {/* Summary — editable for GM, read-only for players */}
            {isGm ? (
              <InlineRichField
                label="GM Notes"
                value={session.summary}
                onSave={(html) => saveField('summary', html)}
                isGmNotes
              />
            ) : session.summary ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">Summary</h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <RichContent value={session.summary} className="prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1" />
              </div>
            ) : null}

            {/* My Notes — personal notes, editable for all users */}
            <section className="bg-surface-container-low/50 p-6 border border-secondary/15 rounded-sm relative overflow-hidden group/section">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/section:opacity-10 transition-opacity pointer-events-none">
                <span className="material-symbols-outlined text-5xl text-secondary">edit_note</span>
              </div>
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">edit_note</span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">My Notes</h3>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/30 border border-outline-variant/15 px-1.5 py-0.5 rounded-full">Private</span>
                </div>
                <InlineRichField
                  label=""
                  value={session.myNote?.content}
                  onSave={(html) => sessionNote.mutate(session.id, html)}
                  placeholder="Add your personal notes for this session…"
                />
              </div>
            </section>

            {/* Prev / next navigation */}
            <div className="flex items-center justify-between pt-8 border-t border-outline-variant/10">
              {prevSession ? (
                <Link
                  to={`/campaigns/${campaignId}/sessions/${prevSession.id}`}
                  className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm group"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                  <span>
                    <span className="text-[10px] uppercase tracking-widest block text-on-surface-variant/50">
                      Previous
                    </span>
                    Session #{String(prevSession.number).padStart(2, '0')}
                  </span>
                </Link>
              ) : (
                <div />
              )}
              {nextSession && (
                <Link
                  to={`/campaigns/${campaignId}/sessions/${nextSession.id}`}
                  className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm group text-right"
                >
                  <span>
                    <span className="text-[10px] uppercase tracking-widest block text-on-surface-variant/50">
                      Next
                    </span>
                    Session #{String(nextSession.number).padStart(2, '0')}
                  </span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </Link>
              )}
            </div>
          </div>

          {/* ── Right column (35%) ─────────────────────────── */}
          <div className="lg:w-[35%] space-y-10 lg:sticky lg:top-8 self-start">

            {/* NPCs in this session */}
            {npcsEnabled && (() => {
              const npcIds = session.npcIds ?? [];
              const linked = npcIds
                .map((id) => allNpcs?.find((n) => n.id === id))
                .filter(Boolean) as NonNullable<typeof allNpcs>[number][];
              linked.sort((a, b) => a.name.localeCompare(b.name));

              const available = (allNpcs ?? [])
                .filter((n) => !npcIds.includes(n.id))
                .filter((n) => !npcSearch.trim() || n.name.toLowerCase().includes(npcSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const addNpc = (id: string) => {
                saveSession.mutate({ ...session, npcIds: [...npcIds, id] });
                setNpcSearchOpen(false); setNpcSearch('');
              };
              const removeNpc = (id: string) => {
                saveSession.mutate({ ...session, npcIds: npcIds.filter((x) => x !== id) });
                setConfirmRemoveNpcId(null);
              };

              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      NPCs
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    {isGm && (
                      <button
                        onClick={() => { setNpcSearchOpen((v) => !v); setNpcSearch(''); }}
                        className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-[13px]">person_add</span>
                        Add
                      </button>
                    )}
                  </div>

                  {isGm && npcSearchOpen && (
                    <div className="border border-outline-variant/20 bg-surface-container-low">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                        <input
                          autoFocus type="text" placeholder="Search NPCs…"
                          value={npcSearch} onChange={(e) => setNpcSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {available.length === 0 ? (
                          <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">No NPCs found.</p>
                        ) : available.map((n) => (
                          <button key={n.id} onClick={() => addNpc(n.id)}
                            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">person</span>
                            <span className="text-xs text-on-surface">{n.name}</span>
                            {n.species && <span className="text-[10px] text-on-surface-variant/40">{n.species}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {linked.length === 0 && !npcSearchOpen ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No NPCs tagged yet.</p>
                  ) : linked.length > 0 ? (
                    <div className="space-y-2">
                      {linked.map((npc) => {
                        const initials = npc.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                        return (
                          <div key={npc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                            <div className="flex items-stretch">
                              <Link to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                                className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                                  {npc.image ? (
                                    <img src={resolveImageUrl(npc.image)} alt={npc.name} className="w-full h-full object-cover rounded-sm" />
                                  ) : (
                                    <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">{npc.name}</p>
                                  {npc.species && <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">{npc.species}</p>}
                                </div>
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                              </Link>
                              {isGm && (confirmRemoveNpcId === npc.id ? (
                                <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                                  <button onClick={() => removeNpc(npc.id)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">Yes</button>
                                  <button onClick={() => setConfirmRemoveNpcId(null)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">No</button>
                                </div>
                              ) : (
                                <button onClick={() => setConfirmRemoveNpcId(npc.id)} title="Remove from session"
                                  className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100">
                                  <span className="material-symbols-outlined text-[14px]">person_remove</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })()}

            {/* Locations in this session */}
            {locationsEnabled && (() => {
              const locationIds = session.locationIds ?? [];
              const linked = locationIds
                .map((id) => allLocations?.find((l) => l.id === id))
                .filter(Boolean) as NonNullable<typeof allLocations>[number][];
              linked.sort((a, b) => a.name.localeCompare(b.name));

              const available = (allLocations ?? [])
                .filter((l) => !locationIds.includes(l.id))
                .filter((l) => !locSearch.trim() || l.name.toLowerCase().includes(locSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const addLoc = (id: string) => {
                saveSession.mutate({ ...session, locationIds: [...locationIds, id] });
                setLocSearchOpen(false); setLocSearch('');
              };
              const removeLoc = (id: string) => {
                saveSession.mutate({ ...session, locationIds: locationIds.filter((x) => x !== id) });
                setConfirmRemoveLocId(null);
              };

              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Locations
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    {isGm && (
                      <button
                        onClick={() => { setLocSearchOpen((v) => !v); setLocSearch(''); }}
                        className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-[13px]">add_location</span>
                        Add
                      </button>
                    )}
                  </div>

                  {isGm && locSearchOpen && (
                    <div className="border border-outline-variant/20 bg-surface-container-low">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                        <input autoFocus type="text" placeholder="Search locations…"
                          value={locSearch} onChange={(e) => setLocSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {available.length === 0 ? (
                          <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">No locations found.</p>
                        ) : available.map((l) => (
                          <button key={l.id} onClick={() => addLoc(l.id)}
                            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors">
                            <LocationIcon locationType={l.type} size="text-[13px]" generic={!locationTypesEnabled} />
                            <span className="text-xs text-on-surface">{l.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {linked.length === 0 && !locSearchOpen ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No locations tagged yet.</p>
                  ) : linked.length > 0 ? (
                    <div className="space-y-2">
                      {linked.map((loc) => (
                        <div key={loc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                          <div className="flex items-stretch">
                            <Link to={`/campaigns/${campaignId}/locations/${loc.id}`}
                              className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0">
                              <LocationIcon locationType={loc.type} size="text-[16px]" generic={!locationTypesEnabled} />
                              <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate flex-1">{loc.name}</p>
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                            </Link>
                            {isGm && (confirmRemoveLocId === loc.id ? (
                              <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                                <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                                <button onClick={() => removeLoc(loc.id)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">Yes</button>
                                <button onClick={() => setConfirmRemoveLocId(null)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmRemoveLocId(loc.id)} title="Remove from session"
                                className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })()}

            {/* Quests in this session */}
            {questsEnabled && (() => {
              const questIds = session.questIds ?? [];
              const linked = questIds
                .map((id) => allQuests?.find((q) => q.id === id))
                .filter(Boolean) as NonNullable<typeof allQuests>[number][];
              linked.sort((a, b) => a.title.localeCompare(b.title));

              const available = (allQuests ?? [])
                .filter((q) => !questIds.includes(q.id))
                .filter((q) => !questSearch.trim() || q.title.toLowerCase().includes(questSearch.toLowerCase()))
                .sort((a, b) => a.title.localeCompare(b.title));

              const addQuest = (id: string) => {
                saveSession.mutate({ ...session, questIds: [...questIds, id] });
                setQuestSearchOpen(false); setQuestSearch('');
              };
              const removeQuest = (id: string) => {
                saveSession.mutate({ ...session, questIds: questIds.filter((x) => x !== id) });
                setConfirmRemoveQuestId(null);
              };

              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Quests
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    {isGm && (
                      <button
                        onClick={() => { setQuestSearchOpen((v) => !v); setQuestSearch(''); }}
                        className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                      >
                        <span className="material-symbols-outlined text-[13px]">add_task</span>
                        Add
                      </button>
                    )}
                  </div>

                  {isGm && questSearchOpen && (
                    <div className="border border-outline-variant/20 bg-surface-container-low">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                        <input autoFocus type="text" placeholder="Search quests…"
                          value={questSearch} onChange={(e) => setQuestSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {available.length === 0 ? (
                          <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">No quests found.</p>
                        ) : available.map((q) => (
                          <button key={q.id} onClick={() => addQuest(q.id)}
                            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">flag</span>
                            <span className="text-xs text-on-surface">{q.title}</span>
                            <span className={`ml-auto px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${QUEST_STATUS_PILL[q.status]}`}>{q.status}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {linked.length === 0 && !questSearchOpen ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No quests linked yet.</p>
                  ) : linked.length > 0 ? (
                    <div className="space-y-2">
                      {linked.map((quest) => (
                        <div key={quest.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                          <div className="flex items-stretch">
                            <Link to={`/campaigns/${campaignId}/quests/${quest.id}`}
                              className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">flag</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">{quest.title}</p>
                              </div>
                              <span className={`flex-shrink-0 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded-full border ${QUEST_STATUS_PILL[quest.status]}`}>
                                {quest.status}
                              </span>
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                            </Link>
                            {isGm && (confirmRemoveQuestId === quest.id ? (
                              <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                                <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                                <button onClick={() => removeQuest(quest.id)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">Yes</button>
                                <button onClick={() => setConfirmRemoveQuestId(null)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmRemoveQuestId(quest.id)} title="Remove from session"
                                className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })()}

            {/* Player Visibility */}
            {isGm && session && (
              <VisibilityPanel
                playerVisible={session.playerVisible ?? false}
                playerVisibleFields={session.playerVisibleFields ?? []}
                fields={SESSION_VISIBILITY_FIELDS}
                basicPreset={SESSION_BASIC_PRESET}
                autoVisibleLabels={['Session #', 'Date']}
                onToggleVisible={(v) => setSessionVisibility.mutate({
                  campaignId: campaignId!, id: session.id,
                  playerVisible: v, playerVisibleFields: session.playerVisibleFields ?? [],
                })}
                onToggleField={(f, on) => {
                  const fields = on
                    ? [...(session.playerVisibleFields ?? []), f]
                    : (session.playerVisibleFields ?? []).filter((x) => x !== f);
                  setSessionVisibility.mutate({
                    campaignId: campaignId!, id: session.id,
                    playerVisible: session.playerVisible ?? false, playerVisibleFields: fields,
                  });
                }}
                onSetPreset={(fields) => setSessionVisibility.mutate({
                  campaignId: campaignId!, id: session.id,
                  playerVisible: session.playerVisible ?? false, playerVisibleFields: fields,
                })}
                isPending={setSessionVisibility.isPending}
              />
            )}

          </div>

        </div>
      </div>

      <SessionEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId ?? ''}
        session={session}
      />
    </main>
  );
}
