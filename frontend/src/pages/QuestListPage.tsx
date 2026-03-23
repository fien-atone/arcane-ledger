import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuests } from '@/features/quests/api';
import type { Quest, QuestStatus } from '@/entities/quest';

const STATUS_CONFIG: Record<QuestStatus, { label: string; dot: string; pill: string; icon: string }> = {
  active:      { label: 'Active',       dot: 'bg-secondary',            pill: 'bg-secondary/10 text-secondary border border-secondary/20',                        icon: 'bolt' },
  completed:   { label: 'Completed',    dot: 'bg-on-surface-variant/30', pill: 'bg-surface-container text-on-surface-variant border border-outline-variant/20',   icon: 'check_circle' },
  failed:      { label: 'Failed',       dot: 'bg-primary/60',            pill: 'bg-primary/5 text-primary/60 border border-primary/20',                           icon: 'cancel' },
  unavailable: { label: 'Unavailable',  dot: 'bg-outline-variant',       pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20', icon: 'lock' },
  unknown:     { label: 'Unknown',      dot: 'bg-on-surface-variant/20', pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',     icon: 'help' },
};

const STATUS_FILTERS: Array<{ value: QuestStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'completed', label: 'Completed' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'failed', label: 'Failed' },
];

function QuestDetail({ quest }: { quest: Quest }) {
  const st = STATUS_CONFIG[quest.status];
  const initials = quest.title.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Hero */}
      <div className="relative w-full h-52 flex-shrink-0 bg-surface-container-low flex items-center justify-center overflow-hidden">
        <span className="font-headline text-[6rem] font-bold text-on-surface-variant/8 select-none leading-none">{initials}</span>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
            {st.label}
          </span>
        </div>
      </div>

      <div className="px-10 py-8 flex flex-col">
        <h2 className={`font-headline text-3xl font-bold text-on-surface tracking-tight mb-6 ${quest.status === 'unavailable' ? 'line-through decoration-on-surface-variant/30' : ''}`}>
          {quest.title}
        </h2>

      {quest.description && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Description</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{quest.description}</p>
        </div>
      )}

      {quest.reward && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Reward</h3>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <p className="text-sm text-on-surface-variant">{quest.reward}</p>
        </div>
      )}

      {quest.notes && (
        <div className="mb-6 relative pl-4">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-[13px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">GM Notes</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{quest.notes}</p>
        </div>
      )}
      </div>
    </div>
  );
}

export default function QuestListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: quests, isLoading, isError } = useQuests(campaignId ?? '');
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = quests?.filter((q) => {
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  }) ?? [];

  const selected = quests?.find((q) => q.id === selectedId) ?? filtered[0] ?? null;

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Quests</h1>
            <p className="text-on-surface-variant text-sm mt-1">Active threads and chronicle of completed tasks.</p>
          </div>
          <button disabled className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 opacity-50 cursor-not-allowed" title="Coming soon">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">New Quest</span>
          </button>
        </div>
      </header>

      {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…</div>}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load quests.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex-shrink-0 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search quests…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-sm placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map(({ value, label }) => {
                  const count = value === 'all' ? (quests?.length ?? 0) : (quests?.filter((q) => q.status === value).length ?? 0);
                  return (
                    <button
                      key={value}
                      onClick={() => setStatusFilter(value)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1 ${
                        statusFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {label}
                      {count > 0 && <span className={`text-[8px] font-bold ${statusFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}`}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {filtered.length === 0 && <p className="text-xs text-on-surface-variant/40 italic p-6">No quests found.</p>}
              {filtered.map((quest) => {
                const st = STATUS_CONFIG[quest.status];
                const isSelected = selected?.id === quest.id;
                return (
                  <button
                    key={quest.id}
                    type="button"
                    onClick={() => setSelectedId(quest.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                      isSelected ? 'bg-primary/8 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent hover:bg-surface-container-low hover:border-l-primary/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${isSelected ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${st.dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isSelected ? 'text-primary font-semibold' : quest.status === 'unavailable' ? 'text-on-surface/50 line-through' : 'text-on-surface font-medium'}`}>{quest.title}</p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>{st.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <QuestDetail quest={selected} />
                <Link
                  to={`/campaigns/${campaignId}/quests/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">Select a quest</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
