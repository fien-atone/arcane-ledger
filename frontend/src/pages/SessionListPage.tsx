import { useParams, Link } from 'react-router-dom';
import { useSessions } from '@/features/sessions/api/queries';
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function SessionListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Sessions
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Chronicle of all gathered sessions, newest first.
            </p>
          </div>
          <button
            disabled
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Session
          </button>
        </div>
      </header>

      <div className="px-12 py-10 max-w-6xl mx-auto pb-20">
        {isLoading && (
          <div className="flex items-center gap-3 text-on-surface-variant py-8">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading sessions…
          </div>
        )}

        {isError && (
          <p className="text-tertiary text-sm py-8">
            Failed to load sessions. Check your connection and try again.
          </p>
        )}

        {sessions && sessions.length === 0 && (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">
              history_edu
            </span>
            <p className="font-headline text-2xl text-on-surface-variant">No sessions yet.</p>
          </div>
        )}

        {/* Session timeline */}
        {sessions && sessions.length > 0 && (
          <section className="space-y-1">
            {sessions.map((session, idx) => {
              const isLatest = idx === 0;
              return (
                <Link
                  key={session.id}
                  to={`/campaigns/${campaignId}/sessions/${session.id}`}
                  className="group relative flex items-start gap-8 p-6 transition-all duration-200 hover:bg-surface-container-low/50 rounded-sm"
                >
                  {/* Number + vertical line */}
                  <div className="flex flex-col items-center flex-shrink-0 w-10">
                    <span
                      className={`text-2xl font-headline font-bold italic leading-none ${
                        isLatest ? 'text-primary' : 'text-primary/50'
                      }`}
                    >
                      {String(session.number).padStart(2, '0')}
                    </span>
                    {idx < sessions.length - 1 && (
                      <div className="w-px flex-1 bg-outline-variant/20 mt-3 min-h-[2rem]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-xl font-headline text-on-surface group-hover:text-primary transition-colors leading-tight">
                        {session.title}
                      </h3>
                      {isLatest ? (
                        <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          Latest
                        </span>
                      ) : (
                        <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-3">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {formatDate(session.datetime)}
                      </span>
                    </div>

                    {session.brief && (
                      <p className="text-on-surface-variant/80 text-sm italic leading-relaxed max-w-3xl">
                        {session.brief}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary/60 transition-colors flex-shrink-0 self-center">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </section>
        )}

        {/* Footer stats */}
        {sessions && sessions.length > 0 && (
          <footer className="mt-16 flex items-center justify-between border-t border-outline-variant/10 pt-8">
            <div className="flex gap-12">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                  Total Sessions
                </p>
                <p className="text-lg font-headline text-on-surface">{sessions.length}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">
                  Latest
                </p>
                <p className="text-lg font-headline text-on-surface">
                  #{String(sessions[0]?.number).padStart(2, '0')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant/30">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              <span className="text-[10px] uppercase tracking-widest">Archive Synced</span>
            </div>
          </footer>
        )}
      </div>
    </main>
  );
}
