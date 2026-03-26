import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CampaignCreateDrawer, useCampaigns } from '@/features/campaigns';
import { useSessions } from '@/features/sessions/api/queries';
import type { CampaignSummary } from '@/entities/campaign';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const isArchived = !!campaign.archivedAt;
  const { data: sessions } = useSessions(campaign.id);

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
      {/* Name */}
      <div className="min-w-0">
        <p className="text-base font-bold text-on-surface group-hover:text-primary transition-colors truncate">
          {campaign.title}
        </p>
      </div>

      {/* Session info */}
      <div className="flex items-center gap-3 justify-end">
        {nextSession ? (
          <>
            {isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[8px] font-bold uppercase tracking-wider border border-primary/30">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                Today
              </span>
            )}
            {isTomorrow && !isToday && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[8px] font-bold uppercase tracking-wider border border-secondary/20">
                <span className="w-1 h-1 rounded-full bg-secondary animate-pulse" />
                Tomorrow
              </span>
            )}
            {!isToday && !isTomorrow && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[8px] font-bold uppercase tracking-wider border border-secondary/20">
                Next
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
          <span className="text-xs text-on-surface-variant/30 italic">No sessions</span>
        )}
      </div>

      {/* Arrow */}
      <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary/60 transition-colors">
        chevron_right
      </span>
    </Link>
  );
}

export default function CampaignsPage() {
  const { data: campaigns, isLoading, isError } = useCampaigns();
  const [createOpen, setCreateOpen] = useState(false);

  const active = (campaigns ?? []).filter((c) => !c.archivedAt);
  const archived = (campaigns ?? []).filter((c) => !!c.archivedAt);

  return (
    <main className="max-w-4xl mx-auto px-8 py-12 pb-24">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-headline text-5xl font-bold tracking-tight text-on-surface">
          My Campaigns
        </h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Campaign
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-on-surface-variant p-12">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading…
        </div>
      )}

      {isError && (
        <p className="text-tertiary text-sm p-12">Failed to load campaigns.</p>
      )}

      {campaigns && campaigns.length === 0 && (
        <div className="text-center py-24 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">auto_stories</span>
          <p className="font-headline text-2xl text-on-surface-variant">No campaigns yet.</p>
          <p className="text-on-surface-variant/50 text-sm">Create the first campaign to get started.</p>
        </div>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
              Active
            </h2>
            <div className="h-px flex-1 bg-outline-variant/20" />
            <span className="text-[10px] text-on-surface-variant/30">{active.length}</span>
          </div>
          <div className="space-y-3">
            {active.map((c) => <CampaignRow key={c.id} campaign={c} />)}
          </div>
        </section>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-on-surface-variant/40 whitespace-nowrap">
              Archive
            </h2>
            <div className="h-px flex-1 bg-outline-variant/10" />
            <span className="text-[10px] text-on-surface-variant/30">{archived.length}</span>
          </div>
          <div className="space-y-3">
            {archived.map((c) => <CampaignRow key={c.id} campaign={c} />)}
          </div>
        </section>
      )}

      <CampaignCreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
