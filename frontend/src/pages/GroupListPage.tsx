import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroups, useSetGroupVisibility } from '@/features/groups/api';
import { GroupEditDrawer } from '@/features/groups/ui';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useGroupTypes } from '@/features/groupTypes';
import { RichContent, EmptyState, SectionDisabled, SectionBackground } from '@/shared/ui';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import type { Group } from '@/entities/group';
import type { GroupTypeEntry } from '@/entities/groupType';

function resolveType(typeId: string, groupTypes: GroupTypeEntry[] | undefined): { name: string; icon: string } {
  const found = groupTypes?.find((t) => t.id === typeId);
  return found ? { name: found.name, icon: found.icon } : { name: typeId, icon: 'category' };
}

function GroupPreview({ group, memberCount, groupTypes, typesEnabled }: {
  group: Group; memberCount: number; groupTypes: GroupTypeEntry[] | undefined; typesEnabled: boolean;
}) {
  const tc = resolveType(group.type, groupTypes);
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-8 py-6 flex flex-col gap-5">
        <div>
          {typesEnabled && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span className="material-symbols-outlined text-[13px]">{tc.icon}</span>
                {tc.name}
              </span>
            </div>
          )}
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
            <RichContent value={group.description} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}

        {group.goals && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">Goals</h3>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            <RichContent value={group.goals} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed prose-p:italic" />
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
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const groupsEnabled = useSectionEnabled(campaignId ?? '', 'groups');
  const groupTypesEnabled = useSectionEnabled(campaignId ?? '', 'group_types');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: groupTypes } = useGroupTypes(campaignId);

  const setGroupVisibility = useSetGroupVisibility();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const debouncedSearch = useDebouncedValue(search);

  const { data: groups, isLoading, isError } = useGroups(campaignId ?? '', {
    search: debouncedSearch,
    type: typeFilter === 'all' ? undefined : typeFilter,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);

  const selected = groups?.find((g) => g.id === selectedId) ?? groups?.[0] ?? null;

  if (!groupsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  const getMemberCount = (groupId: string) =>
    (allNpcs?.filter((n) => n.groupMemberships.some((m) => m.groupId === groupId)).length ?? 0);

  const typeFilterItems: Array<{ value: string; label: string }> = groupTypesEnabled ? [
    { value: 'all', label: 'All' },
    ...(groupTypes ?? []).map((t) => ({ value: t.id, label: t.name })),
  ] : [];

  return (
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-4 flex-shrink-0">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-6 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-surface tracking-tight">Groups</h1>
            <p className="text-on-surface-variant text-sm mt-1">Factions, guilds, families, and other social structures.</p>
          </div>
          {isGm && (
            <button
              onClick={() => { setEditingGroup(undefined); setAddOpen(true); }}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">Add Group</span>
            </button>
          )}
        </div>
      </header>

      {isLoading && !groups && (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading…
        </div>
      )}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load groups.</p>}

      {!isError && (groups || !isLoading) && (
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left panel */}
          <div className="w-[580px] flex-shrink-0 flex flex-col border-r border-outline-variant/10 bg-surface-container-lowest overflow-hidden">

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

              <div className="flex flex-wrap gap-1.5">
                {typeFilterItems.map(({ value, label }) => {
                  const count = value === 'all'
                    ? (groups?.length ?? 0)
                    : (groups?.filter((g) => g.type === value).length ?? 0);
                  return (
                    <button
                      key={value}
                      onClick={() => setTypeFilter(value)}
                      className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full transition-all ${
                        typeFilter === value ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {label} <span className={typeFilter === value ? 'text-on-primary/70' : 'text-on-surface-variant/40'}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
              {(!groups || groups.length === 0) ? (
                <EmptyState icon="groups" title="No groups found." />
              ) : groups.map((g) => {
                const tc = resolveType(g.type, groupTypes);
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
                      {groupTypesEnabled && (
                        <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isSelected ? 'text-primary/50' : 'text-on-surface-variant/40'}`}>
                          {tc.name}
                        </p>
                      )}
                    </div>
                    {isGm && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupVisibility.mutate({
                            campaignId: campaignId!,
                            id: g.id,
                            playerVisible: !g.playerVisible,
                            playerVisibleFields: g.playerVisibleFields ?? [],
                          });
                        }}
                        title={g.playerVisible ? 'Visible to players — click to hide' : 'Hidden from players — click to show'}
                        className={`flex-shrink-0 p-1 transition-colors ${
                          g.playerVisible
                            ? 'text-primary/60 hover:text-primary'
                            : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {g.playerVisible ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 overflow-hidden relative">
            {selected ? (
              <>
                <GroupPreview
                  group={selected}
                  memberCount={getMemberCount(selected.id)}
                  groupTypes={groupTypes}
                  typesEnabled={groupTypesEnabled}
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

    </main>

    <GroupEditDrawer
      open={addOpen || editOpen}
      onClose={() => { setAddOpen(false); setEditOpen(false); }}
      campaignId={campaignId ?? ''}
      group={editingGroup}
    />
    </>
  );
}
