import { useParams, Link } from 'react-router-dom';
import { useSessions } from '@/features/sessions/api/queries';
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

            {/* Edit button */}
            <div className="flex justify-end">
              <button
                disabled
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm opacity-50 cursor-not-allowed"
                title="Coming soon"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Session
              </button>
            </div>

            {/* NPCs in this session (placeholder) */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">group</span>
                NPCs in this session
              </h4>
              <p className="text-xs text-on-surface-variant/40 italic">
                NPC links will appear here once sessions are tagged.
              </p>
            </section>

            {/* Locations in this session (placeholder) */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                Locations in this session
              </h4>
              <p className="text-xs text-on-surface-variant/40 italic">
                Location links will appear here once sessions are tagged.
              </p>
            </section>

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
