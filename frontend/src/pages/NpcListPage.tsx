import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNpcs } from '@/features/npcs/api/queries';
import { NpcEditDrawer } from '@/features/npcs/ui';
import type { NpcStatus } from '@/entities/npc';

type StatusFilter = 'all' | NpcStatus;

const STATUS_PILLS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Alive', value: 'alive' },
  { label: 'Dead', value: 'dead' },
  { label: 'Missing', value: 'missing' },
  { label: 'Unknown', value: 'unknown' },
  { label: 'Hostile', value: 'hostile' },
];

const STATUS_STYLES: Record<NpcStatus, { pill: string; dot: string; label: string }> = {
  alive: {
    pill: 'bg-secondary-container/20 text-secondary border border-secondary-container/30',
    dot: 'bg-secondary',
    label: 'Alive',
  },
  dead: {
    pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20',
    dot: 'bg-outline-variant',
    label: 'Dead',
  },
  missing: {
    pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
    dot: 'bg-on-surface-variant',
    label: 'Missing',
  },
  unknown: {
    pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',
    dot: 'bg-outline',
    label: 'Unknown',
  },
  hostile: {
    pill: 'bg-primary/10 text-primary border border-primary/20',
    dot: 'bg-primary animate-pulse',
    label: 'Hostile',
  },
};

function NpcInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-12 h-12 bg-surface-container-highest rounded-sm border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-on-surface-variant/60">{initials}</span>
    </div>
  );
}

export default function NpcListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: npcs, isLoading, isError } = useNpcs(campaignId ?? '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [factionFilter, setFactionFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);

  // Collect unique groups for dropdown
  const groups = useMemo(() => {
    if (!npcs) return [];
    const names = new Set<string>();
    npcs.forEach((n) => {
      n.groupMemberships.forEach((m) => names.add(m.groupId));
    });
    return Array.from(names);
  }, [npcs]);

  const filtered = useMemo(() => {
    if (!npcs) return [];
    return npcs.filter((n) => {
      const matchSearch =
        !search ||
        n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.aliases.some((a) => a.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchFaction =
        factionFilter === 'all' ||
        n.groupMemberships.some((m) => m.groupId === factionFilter);
      return matchSearch && matchStatus && matchFaction;
    });
  }, [npcs, search, statusFilter, factionFilter]);

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">
              Non-Player Characters
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Catalog of inhabitants, allies, and adversaries across the realms.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add NPC
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Search + faction filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 transition-colors group-focus-within:text-primary">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or alias…"
                className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/20 py-3 pl-12 pr-4 text-sm focus:ring-0 focus:border-primary transition-all placeholder:text-on-surface-variant/40 text-on-surface"
              />
            </div>
            <div className="relative">
              <select
                value={factionFilter}
                onChange={(e) => setFactionFilter(e.target.value)}
                className="bg-surface-container-low border-0 border-b border-outline-variant/20 py-3 pl-4 pr-10 text-sm focus:ring-0 focus:border-primary text-on-surface-variant appearance-none cursor-pointer"
              >
                <option value="all">All Groups</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">
                unfold_more
              </span>
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold mr-1">
              Status:
            </span>
            {STATUS_PILLS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === value
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-surface-container text-on-surface-variant border border-outline-variant/10 hover:border-primary/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-10 py-8 pb-20">
        {isLoading && (
          <div className="flex items-center gap-3 text-on-surface-variant py-8">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Loading characters…
          </div>
        )}

        {isError && (
          <p className="text-tertiary text-sm py-8">
            Failed to load NPCs. Check your connection and try again.
          </p>
        )}

        {npcs && (
          <>
            <div className="bg-surface-container-low rounded-sm overflow-hidden border border-outline-variant/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/10 bg-surface-container">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
                      Character
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
                      Species
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
                      Group
                    </th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">
                      Location
                    </th>
                    <th className="px-6 py-4 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-on-surface-variant text-sm"
                      >
                        No characters match your filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map((npc) => {
                    const st = STATUS_STYLES[npc.status];
                    const primaryFaction = npc.groupMemberships[0];
                    const isHostileRow = npc.status === 'hostile';
                    return (
                      <tr
                        key={npc.id}
                        className={`hover:bg-surface-container transition-colors group ${
                          isHostileRow ? 'border-l-2 border-primary/40 bg-primary/5' : ''
                        }`}
                      >
                        {/* Character */}
                        <td className="px-6 py-5">
                          <Link
                            to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                            className="flex items-center gap-4"
                          >
                            <NpcInitials name={npc.name} />
                            <div>
                              <p className="font-headline font-bold text-on-surface leading-tight group-hover:text-primary transition-colors">
                                {npc.name}
                              </p>
                              {npc.aliases[0] && (
                                <p className="text-xs text-on-surface-variant italic">
                                  {npc.aliases[0]}
                                </p>
                              )}
                            </div>
                          </Link>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${st.pill}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>

                        {/* Species */}
                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {npc.species ?? '—'}
                        </td>

                        {/* Faction */}
                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {primaryFaction ? (
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-primary text-sm">
                                flag
                              </span>
                              <span className="text-on-surface font-medium">
                                {primaryFaction.subfaction ?? primaryFaction.groupId}
                              </span>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Location */}
                        <td className="px-6 py-5 text-sm text-on-surface-variant">
                          {npc.locations[0] ?? '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5 text-right">
                          <Link
                            to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                            className="p-2 hover:text-primary text-on-surface-variant transition-colors inline-block"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              chevron_right
                            </span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Table footer */}
              <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-lowest/50 flex items-center justify-between">
                <p className="text-xs text-on-surface-variant">
                  Showing{' '}
                  <span className="text-on-surface font-bold">{filtered.length}</span> of{' '}
                  <span className="text-on-surface font-bold">{npcs.length}</span> known souls
                </p>
              </div>
            </div>

          </>
        )}
      </div>

      {/* Create drawer */}
      <NpcEditDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        campaignId={campaignId ?? ''}
      />
    </main>
  );
}
