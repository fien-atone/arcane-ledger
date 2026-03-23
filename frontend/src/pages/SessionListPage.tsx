import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSessions } from '@/features/sessions/api/queries';
import type { Session } from '@/entities/session';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function SessionDetail({ session }: { session: Session }) {
  return (
    <div className="flex flex-col overflow-y-auto h-full px-10 py-8">
      <div className="mb-6">
        <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{session.title}</h2>
        <p className="text-xs text-on-surface-variant/50 mt-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[13px]">calendar_today</span>
          {formatDate(session.datetime)}
        </p>
      </div>

      {session.brief && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Brief</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed italic">{session.brief}</p>
        </div>
      )}

      {session.summary && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Summary</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{session.summary}</p>
        </div>
      )}

      {session.nextSessionNotes && (
        <div className="mb-6 relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Next Session Notes</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{session.nextSessionNotes}</p>
        </div>
      )}

    </div>
  );
}

export default function SessionListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: sessions, isLoading, isError } = useSessions(campaignId ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = sessions?.filter((s) =>
    !search ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.brief?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const selected = sessions?.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Sessions</h1>
            <p className="text-on-surface-variant text-sm mt-1">Chronicle of all gathered sessions, newest first.</p>
          </div>
          <button disabled className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed" title="Coming soon">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">New Session</span>
          </button>
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
                <p className="text-xs text-on-surface-variant/40 italic p-6">No sessions found.</p>
              )}
              {filtered.map((session, idx) => {
                const isLatest = idx === 0;
                const isSelected = selected?.id === session.id;
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
                      <span className={`font-headline text-sm font-bold italic ${isSelected ? 'text-primary' : isLatest ? 'text-primary/70' : 'text-on-surface-variant/50'}`}>
                        {String(session.number).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>{session.title}</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>{formatDate(session.datetime)}</p>
                    </div>
                    {isLatest && (
                      <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                        Latest
                      </span>
                    )}
                  </button>
                );
              })}
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
                <SessionDetail session={selected} />
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
    </main>
  );
}
