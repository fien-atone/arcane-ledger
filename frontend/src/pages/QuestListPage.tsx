import { useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuests, useSetQuestVisibility } from '@/features/quests/api';
import { useSectionEnabled, useCampaign } from '@/features/campaigns/api/queries';
import { QuestEditDrawer } from '@/features/quests/ui';
import { EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import { useState } from 'react';
import type { QuestStatus } from '@/entities/quest';

const STATUS_CONFIG: Record<QuestStatus, { label: string; dot: string; pill: string; icon: string; iconColor: string }> = {
  active:       { label: 'Active',       dot: 'bg-secondary',              pill: 'bg-secondary/10 text-secondary border border-secondary/20',                                  icon: 'bolt',           iconColor: 'text-secondary' },
  completed:    { label: 'Completed',    dot: 'bg-emerald-400',             pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',                           icon: 'check_circle',   iconColor: 'text-emerald-400' },
  failed:       { label: 'Failed',       dot: 'bg-rose-400',               pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',                                       icon: 'cancel',         iconColor: 'text-rose-400' },
  unavailable:  { label: 'Unavailable',  dot: 'bg-outline-variant',        pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20',     icon: 'block',          iconColor: 'text-on-surface-variant/40' },
  undiscovered: { label: 'Undiscovered', dot: 'bg-on-surface-variant/20',  pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',                  icon: 'visibility_off', iconColor: 'text-on-surface-variant/30' },
};

const STATUS_FILTERS: Array<{ value: QuestStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'undiscovered', label: 'Undiscovered' },
  { value: 'completed', label: 'Completed' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'failed', label: 'Failed' },
];

export default function QuestListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const questsEnabled = useSectionEnabled(campaignId ?? '', 'quests');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const { data: quests, isLoading, isError } = useQuests(campaignId ?? '');
  const setQuestVisibility = useSetQuestVisibility();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') ?? 'all') as QuestStatus | 'all';

  const [addOpen, setAddOpen] = useState(false);

  if (!questsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const filtered = useMemo(() => {
    if (!quests) return [];
    return quests.filter((q) => {
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      const matchesSearch = !search || q.title.toLowerCase().includes(search.toLowerCase()) || q.description.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [quests, search, statusFilter]);

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
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

      {/* Content — single max-width container */}
      <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface tracking-tight">Quests</h1>
              <p className="text-on-surface-variant text-sm mt-1">Active threads and chronicle of completed tasks.</p>
            </div>
            {isGm && (
              <button
                onClick={() => setAddOpen(true)}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span className="font-label text-xs uppercase tracking-widest">New Quest</span>
              </button>
            )}
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchParams(prev => {
                    if (val) prev.set('q', val); else prev.delete('q');
                    return prev;
                  }, { replace: true });
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-surface-container-high border border-outline-variant/20 rounded-sm focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map(({ label, value }) => {
                const count = value === 'all' ? (quests?.length ?? 0) : (quests?.filter((q) => q.status === value).length ?? 0);
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSearchParams(prev => {
                        if (value === 'all') prev.delete('status'); else prev.set('status', value);
                        return prev;
                      }, { replace: true });
                    }}
                    className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                      statusFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {label} <span className={statusFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                  </button>
                );
              })}
            </div>
            <span className="ml-auto text-[10px] text-on-surface-variant/40">
              <span className="text-on-surface font-bold">{filtered.length}</span> of <span className="text-primary font-bold">{quests?.length ?? 0}</span>
            </span>
          </div>
        </div>

        {isLoading && <div className="flex items-center gap-3 p-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…</div>}
        {isError && <p className="text-tertiary text-sm p-12">Failed to load quests.</p>}

        {!isLoading && !isError && (
          filtered.length === 0 ? (
            <EmptyState icon="map" title="No quests found." subtitle="Create a quest to track objectives." />
          ) : (
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm divide-y divide-outline-variant/10">
              {/* Column headers */}
              <div className="flex items-center gap-3 px-6 py-2 text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
                <span className="w-10 flex-shrink-0" />
                <span className="flex-1 min-w-0">Title</span>
                <span className="w-24 flex-shrink-0">Status</span>
                {isGm && <span className="w-8 flex-shrink-0" />}
              </div>
              {filtered.map((quest) => {
                const st = STATUS_CONFIG[quest.status];
                return (
                  <Link
                    key={quest.id}
                    to={`/campaigns/${campaignId}/quests/${quest.id}`}
                    className="group flex items-center px-6 py-2.5 hover:bg-surface-container-high transition-colors"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center bg-surface-container-highest border border-outline-variant/20">
                        <span className={`material-symbols-outlined text-[16px] ${st.iconColor}`}>{st.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate ${quest.status === 'unavailable' ? 'line-through decoration-on-surface-variant/30' : ''}`}>{quest.title}</p>
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5 truncate sm:hidden">
                          {st.label}
                        </p>
                      </div>
                      <span className={`w-24 flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${st.pill}`}>
                        <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      {isGm && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setQuestVisibility.mutate({
                              campaignId: campaignId!,
                              id: quest.id,
                              playerVisible: !quest.playerVisible,
                              playerVisibleFields: quest.playerVisibleFields ?? [],
                            });
                          }}
                          title={quest.playerVisible ? 'Visible to players' : 'Hidden from players'}
                          className={`w-8 flex-shrink-0 flex items-center justify-center transition-colors ${
                            quest.playerVisible ? 'text-primary/60 hover:text-primary' : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {quest.playerVisible ? 'visibility' : 'visibility_off'}
                          </span>
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>{/* end max-w-5xl container */}

    </main>

    <QuestEditDrawer open={addOpen} onClose={() => setAddOpen(false)} campaignId={campaignId ?? ''} />
    </>
  );
}
