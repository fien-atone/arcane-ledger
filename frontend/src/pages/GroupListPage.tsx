import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroups } from '@/features/groups/api';
import { GroupEditDrawer } from '@/features/groups/ui';
import { useNpcs } from '@/features/npcs/api/queries';
import { useGroupTypes } from '@/features/groupTypes';
import type { Group } from '@/entities/group';
import type { GroupTypeEntry } from '@/entities/groupType';

const RELATION_CONFIG: Record<string, { label: string; pill: string; dot: string; icon: string }> = {
  allied:  { label: 'Allied',   pill: 'bg-secondary/10 text-secondary border border-secondary/20',                       dot: 'bg-secondary',            icon: 'handshake' },
  neutral: { label: 'Neutral',  pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/20',     dot: 'bg-on-surface-variant/40', icon: 'remove' },
  hostile: { label: 'Hostile',  pill: 'bg-primary/10 text-primary border border-primary/20',                             dot: 'bg-primary/60',            icon: 'warning' },
  unknown: { label: 'Unknown',  pill: 'bg-surface-container text-on-surface-variant/60 border border-outline-variant/10', dot: 'bg-outline-variant',      icon: 'help' },
};


function resolveType(
  typeId: string,
  groupTypes: GroupTypeEntry[] | undefined,
): { name: string; icon: string } {
  const found = groupTypes?.find((t) => t.id === typeId);
  return found ? { name: found.name, icon: found.icon } : { name: typeId, icon: 'category' };
}

function GroupPreview({
  group,
  campaignId: _campaignId,
  memberCount,
  groupTypes,
}: {
  group: Group;
  campaignId: string;
  memberCount: number;
  groupTypes: GroupTypeEntry[] | undefined;
}) {
  const tc = resolveType(group.type, groupTypes);
  const rel = group.partyRelation ? (RELATION_CONFIG[group.partyRelation] ?? RELATION_CONFIG.unknown) : null;
  const initials = group.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Hero / initials */}
      <div className="relative w-full h-52 flex-shrink-0 bg-surface-container-low flex items-center justify-center overflow-hidden">
        <span className="font-headline text-[8rem] font-bold text-on-surface-variant/8 select-none leading-none">
          {initials}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">{tc.icon}</span>
            {tc.name}
          </span>
          {rel && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container/90 backdrop-blur-sm border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="material-symbols-outlined text-[13px]">{rel.icon}</span>
              {rel.label}
            </span>
          )}
        </div>
      </div>

      <div className="px-8 py-6 flex flex-col gap-5">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{group.name}</h2>
          {group.aliases.length > 0 && (
            <p className="text-xs text-on-surface-variant/40 italic mt-0.5">{group.aliases.join(', ')}</p>
          )}
        </div>

        {group.description && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">About</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{group.description}</p>
          </div>
        )}

        {group.goals && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Goals</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed italic">{group.goals}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-on-surface-variant/60">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">group</span>
            <span className="font-bold text-on-surface">{memberCount}</span> members
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GroupListPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const { data: groups, isLoading, isError } = useGroups(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: groupTypes } = useGroupTypes();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [relationFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);

  const filtered = (groups ?? []).filter((g) => {
    const matchesType = typeFilter === 'all' || g.type === typeFilter;
    const matchesRelation = relationFilter === 'all' || (g.partyRelation ?? 'unknown') === relationFilter;
    const matchesSearch =
      !search ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesRelation && matchesSearch;
  });

  const selected = groups?.find((g) => g.id === selectedId) ?? filtered[0] ?? null;

  const getMemberCount = (groupId: string) =>
    allNpcs?.filter((n) => n.groupMemberships.some((m) => m.groupId === groupId)).length ?? 0;

  // Build dynamic type filter buttons: 'all' + one per groupType
  const typeFilterItems: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All' },
    ...(groupTypes ?? []).map((t) => ({ value: t.id, label: t.name })),
  ];

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Groups</h1>
            <p className="text-on-surface-variant text-sm mt-1">Factions, guilds, families, and other social structures.</p>
          </div>
          <button
            onClick={() => { setEditingGroup(undefined); setAddOpen(true); }}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label text-xs uppercase tracking-widest">Add Group</span>
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading…
        </div>
      )}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load groups.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">

            {/* Search + filters */}
            <div className="px-4 pt-4 pb-3 border-b border-outline-variant/10 flex-shrink-0 space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
                <input
                  type="text"
                  placeholder="Search groups…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-surface-container border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary text-on-surface text-xs placeholder:text-on-surface-variant/30 transition-colors"
                />
              </div>

              {/* Type filter */}
              <div className="flex flex-wrap gap-1.5">
                {typeFilterItems.map(({ value, label }) => {
                  const count = value === 'all' ? (groups?.length ?? 0) : (groups?.filter((g) => g.type === value).length ?? 0);
                  return (
                    <button
                      key={value}
                      onClick={() => setTypeFilter(value)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all flex items-center gap-1 ${
                        typeFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className={`text-[8px] font-bold ${typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center px-6">
                  <span className="material-symbols-outlined text-on-surface-variant/20 text-5xl">groups</span>
                  <p className="font-headline text-lg text-on-surface-variant">No groups found.</p>
                </div>
              )}
              {filtered.map((g) => {
                const tc = resolveType(g.type, groupTypes);
                const rel = g.partyRelation ? (RELATION_CONFIG[g.partyRelation] ?? RELATION_CONFIG.unknown) : null;
                const isSelected = selected?.id === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedId(g.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-outline-variant/5 transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary/8 border-l-2 border-l-primary'
                        : 'border-l-2 border-l-transparent hover:bg-surface-container-high hover:border-l-primary/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-sm flex-shrink-0 flex items-center justify-center border ${isSelected ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                      <span className={`material-symbols-outlined text-[18px] ${isSelected ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                        {tc.icon ?? 'category'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate transition-colors ${isSelected ? 'text-primary font-semibold' : 'text-on-surface font-medium'}`}>
                        {g.name}
                      </p>
                      <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
                        {tc.name}
                      </p>
                    </div>
                    {rel && (
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${rel.pill}`}>
                        {rel.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {groups && groups.length > 0 && (
              <div className="px-4 py-2 border-t border-outline-variant/10 flex-shrink-0">
                <p className="text-[10px] text-on-surface-variant/40">
                  <span className="text-primary font-bold">{filtered.length}</span>
                  <span className="text-on-surface-variant/30"> of </span>
                  <span className="text-primary font-bold">{groups.length}</span> groups
                </p>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <GroupPreview
                  group={selected}
                  campaignId={campaignId ?? ''}
                  memberCount={getMemberCount(selected.id)}
                  groupTypes={groupTypes}
                />
                <Link
                  to={`/campaigns/${campaignId}/groups/${selected.id}`}
                  className="absolute top-3 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-on-surface-variant/30 text-sm italic">
                Select a group
              </div>
            )}
          </div>
        </div>
      )}

      <GroupEditDrawer
        open={addOpen || editOpen}
        onClose={() => { setAddOpen(false); setEditOpen(false); }}
        campaignId={campaignId ?? ''}
        group={editingGroup}
      />
    </main>
  );
}
