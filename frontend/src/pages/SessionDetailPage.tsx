import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSessions, useSaveSession, useDeleteSession, useSessionNote } from '@/features/sessions/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { useQuests } from '@/features/quests/api';
import { SessionEditDrawer } from '@/features/sessions/ui';
import { LocationIcon, InlineRichField, RichContent, SectionDisabled, SectionBackground } from '@/shared/ui';
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

const QUEST_STATUS_PILL: Record<QuestStatus, { cls: string; icon: string; iconColor: string }> = {
  active:      { cls: 'bg-secondary/10 text-secondary border-secondary/20', icon: 'bolt',           iconColor: 'text-secondary' },
  completed:   { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'check_circle',   iconColor: 'text-emerald-400' },
  failed:      { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: 'cancel',         iconColor: 'text-rose-400' },
  unavailable: { cls: 'bg-surface-container-highest text-on-surface-variant/50 border-outline-variant/20', icon: 'block',          iconColor: 'text-on-surface-variant/40' },
  undiscovered: { cls: 'bg-surface-variant text-on-surface-variant border-outline-variant/10', icon: 'visibility_off', iconColor: 'text-on-surface-variant/30' },
};

function toGoogleCalUrl(title: string, datetime: string, description?: string): string {
  const start = new Date(datetime);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
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
  const locationTypesEnabled = useSectionEnabled(campaignId ?? '', 'location_types');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');
  const session = sessions?.find((s) => s.id === sessionId);
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allQuests } = useQuests(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const saveSession = useSaveSession(campaignId ?? '');
  const deleteSession = useDeleteSession(campaignId ?? '');
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

  if (isLoading && !session) {
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
    <>
    <SectionBackground />
    <main className="flex-1 min-h-screen relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
        {/* Header card (full width) */}
        <section className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">
              Session #{String(session.number).padStart(2, '0')}
            </span>
            <div className="h-px w-12 bg-outline-variant/30" />
            {session.datetime && (
              <span className="text-sm text-on-surface-variant/60">
                {formatDateTime(session.datetime)}
              </span>
            )}
          </div>
          <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface tracking-tight leading-tight">
            {session.title}
          </h1>

          {/* Edit/Delete/Calendar — absolute top-right */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
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
                  <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                    <span className="text-[9px] text-on-surface-variant">Delete?</span>
                    <button
                      onClick={() => deleteSession.mutate(session.id, { onSuccess: () => navigate(`/campaigns/${campaignId}/sessions`) })}
                      className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
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
        </section>

        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row gap-8 min-w-0">

          {/* Left column — Brief, Session Notes, Prev/Next */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Brief */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
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
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">Brief</h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
                  <RichContent value={session.brief} className="prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:my-1" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">Brief</h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
                  <p className="text-xs text-on-surface-variant/40 italic">No brief yet.</p>
                </div>
              )}
            </div>

            {/* Session Notes */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <section className={isGm ? '' : 'bg-surface-container-low/50 p-4 border border-secondary/15 rounded-sm relative overflow-hidden'}>
                {!isGm && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-secondary text-sm">edit_note</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-secondary">My Notes</h3>
                    <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/30 border border-outline-variant/15 px-1.5 py-0.5 rounded-full">Private</span>
                  </div>
                )}
                <InlineRichField
                  label={isGm ? 'GM Notes' : ''}
                  value={session.myNote?.content}
                  onSave={(html) => sessionNote.mutate(session.id, html)}
                  placeholder={isGm ? 'Your private GM notes for this session…' : 'Add your personal notes for this session…'}
                  isGmNotes={isGm}
                />
              </section>
            </div>

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

          {/* Right column — NPCs, Locations, Quests */}
          <div className="md:w-[35%] space-y-8">

            {/* NPCs in this session */}
            {(() => {
              const npcIds = session.npcIds ?? [];
              const linked = [...(session.npcs ?? [])].sort((a, b) => a.name.localeCompare(b.name));

              const available = (allNpcs ?? [])
                .filter((n) => !npcIds.includes(n.id))
                .filter((n) => !npcSearch.trim() || n.name.toLowerCase().includes(npcSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const addNpc = async (id: string) => {
                await saveSession.mutate({ ...session, npcIds: [...npcIds, id] }, { only: 'npcIds' });
                setNpcSearchOpen(false); setNpcSearch('');
              };
              const removeNpc = async (id: string) => {
                await saveSession.mutate({ ...session, npcIds: npcIds.filter((x) => x !== id) }, { only: 'npcIds' });
                setConfirmRemoveNpcId(null);
              };

              return (
                <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
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
                    <div className="border border-outline-variant/20 bg-surface-container-low mb-4">
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
                                  <span className="text-[10px] text-on-surface-variant">Remove?</span>
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
                </div>
              );
            })()}

            {/* Locations in this session */}
            {(() => {
              const locationIds = session.locationIds ?? [];
              const linked = [...(session.locations ?? [])].sort((a, b) => a.name.localeCompare(b.name));

              const available = (allLocations ?? [])
                .filter((l) => !locationIds.includes(l.id))
                .filter((l) => !locSearch.trim() || l.name.toLowerCase().includes(locSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const addLoc = async (id: string) => {
                await saveSession.mutate({ ...session, locationIds: [...locationIds, id] }, { only: 'locationIds' });
                setLocSearchOpen(false); setLocSearch('');
              };
              const removeLoc = async (id: string) => {
                await saveSession.mutate({ ...session, locationIds: locationIds.filter((x) => x !== id) }, { only: 'locationIds' });
                setConfirmRemoveLocId(null);
              };

              return (
                <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
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
                    <div className="border border-outline-variant/20 bg-surface-container-low mb-4">
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
                              <LocationIcon locationType={loc.type ?? ''} size="text-[16px]" generic={!locationTypesEnabled} />
                              <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate flex-1">{loc.name}</p>
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                            </Link>
                            {isGm && (confirmRemoveLocId === loc.id ? (
                              <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                                <span className="text-[10px] text-on-surface-variant">Remove?</span>
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
                </div>
              );
            })()}

            {/* Quests in this session */}
            {(() => {
              const questIds = session.questIds ?? [];
              const linked = [...(session.quests ?? [])].sort((a, b) => a.title.localeCompare(b.title));

              const available = (allQuests ?? [])
                .filter((q) => !questIds.includes(q.id))
                .filter((q) => !questSearch.trim() || q.title.toLowerCase().includes(questSearch.toLowerCase()))
                .sort((a, b) => a.title.localeCompare(b.title));

              const addQuest = async (id: string) => {
                await saveSession.mutate({ ...session, questIds: [...questIds, id] }, { only: 'questIds' });
                setQuestSearchOpen(false); setQuestSearch('');
              };
              const removeQuest = async (id: string) => {
                await saveSession.mutate({ ...session, questIds: questIds.filter((x) => x !== id) }, { only: 'questIds' });
                setConfirmRemoveQuestId(null);
              };

              return (
                <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
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
                    <div className="border border-outline-variant/20 bg-surface-container-low mb-4">
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
                            <span className={`material-symbols-outlined text-[14px] ${QUEST_STATUS_PILL[q.status?.toLowerCase() as QuestStatus]?.iconColor ?? 'text-on-surface-variant/40'}`}>{QUEST_STATUS_PILL[q.status?.toLowerCase() as QuestStatus]?.icon ?? 'flag'}</span>
                            <span className="text-xs text-on-surface">{q.title}</span>
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
                              <span className={`material-symbols-outlined text-[16px] ${QUEST_STATUS_PILL[quest.status?.toLowerCase() as QuestStatus]?.iconColor ?? 'text-on-surface-variant/40'}`}>{QUEST_STATUS_PILL[quest.status?.toLowerCase() as QuestStatus]?.icon ?? 'flag'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">{quest.title}</p>
                              </div>
                              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                            </Link>
                            {isGm && (confirmRemoveQuestId === quest.id ? (
                              <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                                <span className="text-[10px] text-on-surface-variant">Remove?</span>
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
                </div>
              );
            })()}

          </div>

        </div>
      </div>

    </main>

    <SessionEditDrawer
      open={editOpen}
      onClose={() => setEditOpen(false)}
      campaignId={campaignId ?? ''}
      session={session}
    />
    </>
  );
}
