import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSessions, useSaveSession } from '@/features/sessions/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { BackLink } from '@/shared/ui';
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function SessionDetailPage() {
  const { id: campaignId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');
  const session = sessions?.find((s) => s.id === sessionId);
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const saveSession = useSaveSession(campaignId ?? '');
  const [npcSearch, setNpcSearch] = useState('');
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);
  const [locSearch, setLocSearch] = useState('');
  const [locSearchOpen, setLocSearchOpen] = useState(false);

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
  const prevSession = sorted[idx + 1]; // older
  const nextSession = sorted[idx - 1]; // newer

  // Parse nextSessionNotes into bullet list if it contains "?"
  const noteBullets = session.nextSessionNotes
    ? session.nextSessionNotes.split('?').filter((s) => s.trim()).map((s) => s.trim() + '?')
    : [];

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Back breadcrumb */}
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
                <span className="text-sm text-on-surface-variant/60">
                  {formatDateTime(session.datetime)}
                </span>
              </div>
              <h1 className="font-headline text-5xl font-bold text-on-surface tracking-tight leading-tight">
                {session.title}
              </h1>
              {session.brief && (
                <p className="text-on-surface-variant italic text-lg">{session.brief}</p>
              )}
            </header>

            {/* Summary */}
            {session.summary ? (
              <section className="space-y-6 text-lg leading-relaxed text-on-surface-variant/90">
                {session.summary.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </section>
            ) : (
              <p className="text-on-surface-variant/40 italic text-sm">
                No summary written for this session yet.
              </p>
            )}

            {/* Unresolved threads */}
            {session.nextSessionNotes && (
              <section className="bg-surface-container-low p-8 border border-primary/20 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary">warning</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-sm">priority_high</span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">
                      Unresolved Threads
                    </h3>
                  </div>
                  {noteBullets.length > 1 ? (
                    <ul className="space-y-4">
                      {noteBullets.map((note, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-on-surface-variant text-sm">{note}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-on-surface-variant text-sm">{session.nextSessionNotes}</p>
                  )}
                </div>
              </section>
            )}

            {/* My notes (placeholder — both roles) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 font-bold">
                  My notes (only visible to you)
                </h3>
                <span
                  className="material-symbols-outlined text-on-surface-variant/30 text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lock
                </span>
              </div>
              <textarea
                className="w-full h-36 bg-surface-container-lowest border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface p-4 transition-all placeholder:text-on-surface-variant/20 resize-none text-sm"
                placeholder="Scratchpad for your personal session notes…"
                disabled
              />
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
            {(() => {
              const npcIds = session.npcIds ?? [];
              const linked = npcIds.map((id) => allNpcs?.find((n) => n.id === id)).filter(Boolean) as NonNullable<typeof allNpcs>[number][];
              const available = (allNpcs ?? [])
                .filter((n) => !npcIds.includes(n.id))
                .filter((n) => !npcSearch.trim() || n.name.toLowerCase().includes(npcSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const addNpc = (id: string) => {
                saveSession.mutate({ ...session, npcIds: [...npcIds, id] });
                setNpcSearchOpen(false); setNpcSearch('');
              };
              const removeNpc = (id: string) =>
                saveSession.mutate({ ...session, npcIds: npcIds.filter((x) => x !== id) });

              return (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">NPCs</h4>
                    <button onClick={() => setNpcSearchOpen((v) => !v)}
                      className="flex items-center gap-1 text-[10px] font-label uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[13px]">add</span>Add
                    </button>
                  </div>
                  {npcSearchOpen && (
                    <div className="border border-outline-variant/20 rounded-sm bg-surface-container-low">
                      <div className="p-2 border-b border-outline-variant/15">
                        <input autoFocus type="text" value={npcSearch} onChange={(e) => setNpcSearch(e.target.value)}
                          placeholder="Search NPCs…"
                          className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none px-1" />
                      </div>
                      <ul className="max-h-48 overflow-y-auto">
                        {available.length === 0
                          ? <li className="px-3 py-2 text-xs text-on-surface-variant/40 italic">No NPCs found</li>
                          : available.map((n) => (
                            <li key={n.id}>
                              <button onClick={() => addNpc(n.id)}
                                className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[13px] text-primary/60">person</span>
                                {n.name}
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {linked.length === 0 && !npcSearchOpen
                    ? <p className="text-xs text-on-surface-variant/40 italic">No NPCs tagged yet.</p>
                    : <ul className="space-y-1.5">
                        {linked.map((n) => (
                          <li key={n.id} className="flex items-center gap-2 group/item">
                            <Link to={`/campaigns/${campaignId}/npcs/${n.id}`}
                              className="flex-1 flex items-center gap-2 p-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-outline-variant/30 rounded-sm transition-colors group">
                              <span className="material-symbols-outlined text-[14px] text-primary/60">person</span>
                              <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{n.name}</span>
                            </Link>
                            <button onClick={() => removeNpc(n.id)}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 text-on-surface-variant/30 hover:text-error transition-all" title="Remove">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                  }
                </section>
              );
            })()}

            {/* Locations in this session */}
            {(() => {
              const locationIds = session.locationIds ?? [];
              const linked = locationIds.map((id) => allLocations?.find((l) => l.id === id)).filter(Boolean) as NonNullable<typeof allLocations>[number][];
              const available = (allLocations ?? [])
                .filter((l) => !locationIds.includes(l.id))
                .filter((l) => !locSearch.trim() || l.name.toLowerCase().includes(locSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const addLoc = (id: string) => {
                saveSession.mutate({ ...session, locationIds: [...locationIds, id] });
                setLocSearchOpen(false); setLocSearch('');
              };
              const removeLoc = (id: string) =>
                saveSession.mutate({ ...session, locationIds: locationIds.filter((x) => x !== id) });

              return (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Locations</h4>
                    <button onClick={() => setLocSearchOpen((v) => !v)}
                      className="flex items-center gap-1 text-[10px] font-label uppercase tracking-widest text-primary/60 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[13px]">add</span>Add
                    </button>
                  </div>
                  {locSearchOpen && (
                    <div className="border border-outline-variant/20 rounded-sm bg-surface-container-low">
                      <div className="p-2 border-b border-outline-variant/15">
                        <input autoFocus type="text" value={locSearch} onChange={(e) => setLocSearch(e.target.value)}
                          placeholder="Search locations…"
                          className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/30 outline-none px-1" />
                      </div>
                      <ul className="max-h-48 overflow-y-auto">
                        {available.length === 0
                          ? <li className="px-3 py-2 text-xs text-on-surface-variant/40 italic">No locations found</li>
                          : available.map((l) => (
                            <li key={l.id}>
                              <button onClick={() => addLoc(l.id)}
                                className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[13px] text-primary/60">location_on</span>
                                {l.name}
                              </button>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  {linked.length === 0 && !locSearchOpen
                    ? <p className="text-xs text-on-surface-variant/40 italic">No locations tagged yet.</p>
                    : <ul className="space-y-1.5">
                        {linked.map((l) => (
                          <li key={l.id} className="flex items-center gap-2 group/item">
                            <Link to={`/campaigns/${campaignId}/locations/${l.id}`}
                              className="flex-1 flex items-center gap-2 p-2.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-outline-variant/30 rounded-sm transition-colors group">
                              <span className="material-symbols-outlined text-[14px] text-primary/60">location_on</span>
                              <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{l.name}</span>
                            </Link>
                            <button onClick={() => removeLoc(l.id)}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 text-on-surface-variant/30 hover:text-error transition-all" title="Remove">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                  }
                </section>
              );
            })()}

            {/* Quests mentioned */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">gavel</span>
                Quests mentioned
              </h4>
              <p className="text-xs text-on-surface-variant/40 italic">
                Quest links will appear here once sessions are tagged.
              </p>
            </section>

            {/* Session metadata */}
            <div className="bg-surface-container-low p-6 rounded-sm ring-1 ring-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Session Metadata
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Number</span>
                  <span className="text-on-surface font-bold">
                    #{String(session.number).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Date</span>
                  <span className="text-on-surface">{formatDateTime(session.datetime)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Has threads</span>
                  <span className={session.nextSessionNotes ? 'text-primary font-bold' : 'text-on-surface-variant'}>
                    {session.nextSessionNotes ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
