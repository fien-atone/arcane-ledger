import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuests } from '@/features/quests/api';
import type { QuestStatus } from '@/entities/quest';

const STATUS_CONFIG: Record<QuestStatus, { label: string; dot: string; pill: string }> = {
  active: {
    label: 'Active',
    dot: 'bg-secondary',
    pill: 'bg-secondary/10 text-secondary border border-secondary/20',
  },
  completed: {
    label: 'Completed',
    dot: 'bg-on-surface-variant/30',
    pill: 'bg-surface-container text-on-surface-variant border border-outline-variant/20',
  },
  failed: {
    label: 'Failed',
    dot: 'bg-primary/60',
    pill: 'bg-primary/5 text-primary/60 border border-primary/20',
  },
  unavailable: {
    label: 'Unavailable',
    dot: 'bg-outline-variant',
    pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20',
  },
  unknown: {
    label: 'Unknown',
    dot: 'bg-on-surface-variant/20',
    pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',
  },
};

const STATUS_FILTERS: Array<{ value: QuestStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'completed', label: 'Completed' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'failed', label: 'Failed' },
];

export default function QuestListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: quests, isLoading, isError } = useQuests(campaignId ?? '');

  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = quests?.filter((q) => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesSearch =
      !search ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Quests
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Active threads and chronicle of completed tasks.
            </p>
            {/* Inline stats */}
            {quests && quests.length > 0 && (
              <div className="flex gap-6 mt-4">
                {[
                  { label: 'Total', value: quests.length, color: 'text-on-surface' },
                  { label: 'Active', value: quests.filter((q) => q.status === 'active').length, color: 'text-secondary' },
                  { label: 'Unknown', value: quests.filter((q) => q.status === 'unknown').length, color: 'text-on-surface-variant' },
                  { label: 'Completed', value: quests.filter((q) => q.status === 'completed').length, color: 'text-on-surface-variant' },
                  { label: 'Unavailable', value: quests.filter((q) => q.status === 'unavailable').length, color: 'text-on-surface-variant/50' },
                  { label: 'Failed', value: quests.filter((q) => q.status === 'failed').length, color: 'text-primary/60' },
                ]
                  .filter((s) => s.value > 0)
                  .map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/50">{label}</p>
                      <p className={`text-base font-headline font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
          <button
            disabled
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">New Quest</span>
          </button>
        </div>
      </header>

      <div className="px-10 py-10 pb-24 max-w-5xl">
        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search quests…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
            />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${
                statusFilter === value
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 text-on-surface-variant py-8">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading quests…
          </div>
        )}

        {isError && (
          <p className="text-tertiary text-sm py-8">
            Failed to load quests. Check your connection and try again.
          </p>
        )}

        {/* Quest list */}
        {filtered && filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((quest) => {
              const st = STATUS_CONFIG[quest.status];
              const isUnavailable = quest.status === 'unavailable';
              return (
                <Link
                  key={quest.id}
                  to={`/campaigns/${campaignId}/quests/${quest.id}`}
                  className={`group flex items-start gap-6 p-6 bg-surface-container-low hover:bg-surface-container border-b border-outline-variant/10 transition-all duration-200 ${
                    isUnavailable ? 'opacity-60' : ''
                  }`}
                >
                  {/* Status indicator */}
                  <div className="flex-shrink-0 pt-1">
                    <span className={`w-2 h-2 rounded-full block mt-1 ${st.dot}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`font-headline text-xl text-on-surface group-hover:text-primary transition-colors leading-tight ${isUnavailable ? 'line-through decoration-on-surface-variant/30' : ''}`}>
                        {quest.title}
                      </h3>
                      <span
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${st.pill}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant/80 leading-relaxed line-clamp-2">
                      {quest.description}
                    </p>
                    {quest.notes && (
                      <p className="mt-2 text-[11px] text-primary/60 italic truncate">
                        <span className="material-symbols-outlined text-[12px] align-middle mr-1">
                          lock
                        </span>
                        {quest.notes}
                      </p>
                    )}
                  </div>

                  <span className="material-symbols-outlined text-on-surface-variant/20 group-hover:text-primary/60 transition-colors flex-shrink-0 self-center">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filtered && filtered.length === 0 && !isLoading && (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">
              gavel
            </span>
            <p className="font-headline text-2xl text-on-surface-variant">No quests found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
