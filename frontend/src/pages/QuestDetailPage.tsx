import { useParams, Link } from 'react-router-dom';
import { useQuest, useQuests } from '@/features/quests/api';
import { useNpcs } from '@/features/npcs/api/queries';
import type { QuestStatus } from '@/entities/quest';

const STATUS_CONFIG: Record<QuestStatus, { label: string; pill: string }> = {
  active: {
    label: 'Active',
    pill: 'bg-secondary/10 text-secondary border border-secondary/20',
  },
  completed: {
    label: 'Completed',
    pill: 'bg-surface-container text-on-surface-variant border border-outline-variant/20',
  },
  failed: {
    label: 'Failed',
    pill: 'bg-primary/5 text-primary/60 border border-primary/20',
  },
  unavailable: {
    label: 'Unavailable',
    pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20',
  },
  unknown: {
    label: 'Unknown',
    pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function QuestDetailPage() {
  const { id: campaignId, questId } = useParams<{ id: string; questId: string }>();
  const { data: quest, isLoading, isError } = useQuest(campaignId ?? '', questId ?? '');
  const { data: quests } = useQuests(campaignId ?? '');
  const { data: npcs } = useNpcs(campaignId ?? '');

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !quest) {
    return (
      <main className="p-12">
        <Link
          to={`/campaigns/${campaignId}/quests`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest mb-8"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Quests
        </Link>
        <p className="text-tertiary text-sm">Quest not found.</p>
      </main>
    );
  }

  const st = STATUS_CONFIG[quest.status];
  const isUnavailable = quest.status === 'unavailable';

  const giver = quest.giverId ? npcs?.find((n) => n.id === quest.giverId) : undefined;

  // Related quests (same campaign, not this quest)
  const relatedQuests = quests
    ?.filter((q) => q.id !== quest.id && (q.status === 'active' || q.status === 'unknown'))
    .slice(0, 3);

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="px-10 pt-8">
        <Link
          to={`/campaigns/${campaignId}/quests`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          All Quests
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Quest header */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${st.pill}`}>
                  {st.label}
                </span>
                <span className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest">
                  {formatDate(quest.createdAt)}
                </span>
              </div>
              <h1 className={`font-headline text-5xl font-bold text-on-surface tracking-tight leading-tight ${isUnavailable ? 'opacity-50' : ''}`}>
                {quest.title}
              </h1>
              {isUnavailable && (
                <p className="text-xs text-on-surface-variant/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">block</span>
                  This quest is no longer accessible — the circumstances that made it possible no longer exist.
                </p>
              )}
            </header>

            {/* Description */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Description
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              <p className="text-on-surface-variant leading-loose text-base">
                {quest.description}
              </p>
            </section>

            {/* GM Notes */}
            {quest.notes && (
              <section className="bg-surface-container-low p-8 border border-primary/20 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary">lock</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="material-symbols-outlined text-primary text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      lock
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary">
                      GM Notes
                    </h3>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-relaxed italic">
                    {quest.notes}
                  </p>
                </div>
              </section>
            )}
          </div>

          {/* ── Right column (35%) ──────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            {/* Edit button */}
            <div className="flex justify-end">
              <button
                disabled
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm opacity-50 cursor-not-allowed"
                title="Coming soon"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Quest
              </button>
            </div>

            {/* Quest giver */}
            {giver ? (
              <div className="bg-surface-container-low p-5 rounded-sm ring-1 ring-outline-variant/10">
                <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-3">
                  Quest Giver
                </h4>
                <Link
                  to={`/campaigns/${campaignId}/npcs/${giver.id}`}
                  className="group flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <div className="w-9 h-9 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-on-surface-variant/60">
                      {giver.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {giver.name}
                    </p>
                    {giver.species && (
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{giver.species}</p>
                    )}
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/30 group-hover:text-primary/60 ml-auto">
                    arrow_forward
                  </span>
                </Link>
              </div>
            ) : (
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">person</span>
                  Quest Giver
                </h4>
                <p className="text-xs text-on-surface-variant/40 italic">
                  NPC link will appear here once tagged.
                </p>
              </section>
            )}

            {/* Quick status card */}
            <div className="bg-surface-container-low p-6 rounded-sm ring-1 ring-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Quest Details
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${st.pill}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Created</span>
                  <span className="text-on-surface">{formatDate(quest.createdAt)}</span>
                </div>
                {quest.completedAt && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-on-surface-variant/60 italic">Resolved</span>
                    <span className="text-on-surface">{formatDate(quest.completedAt)}</span>
                  </div>
                )}
                {quest.reward && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-on-surface-variant/60 italic">Reward</span>
                    <span className="text-secondary font-bold">{quest.reward}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Related active quests */}
            {relatedQuests && relatedQuests.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40">
                  Other Active Quests
                </h4>
                <div className="space-y-2">
                  {relatedQuests.map((q) => (
                    <Link
                      key={q.id}
                      to={`/campaigns/${campaignId}/quests/${q.id}`}
                      className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container transition-colors group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary flex-shrink-0" />
                      <span className="text-xs text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                        {q.title}
                      </span>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/30 group-hover:text-primary/60">
                        chevron_right
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
