import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroup, useSaveGroup } from '@/features/groups/api';
import { GroupEditDrawer } from '@/features/groups/ui';
import { useNpcs, useSaveNpc } from '@/features/npcs/api/queries';
import { useGroupTypes } from '@/features/groupTypes';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, BackLink, GmNotesSection } from '@/shared/ui';
import type { NPC, NpcStatus } from '@/entities/npc';

const RELATION_CONFIG: Record<string, { label: string; pill: string; icon: string }> = {
  allied:  { label: 'Allied',   pill: 'bg-secondary/10 text-secondary border border-secondary/20',                        icon: 'handshake' },
  neutral: { label: 'Neutral',  pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/20',      icon: 'remove' },
  hostile: { label: 'Hostile',  pill: 'bg-primary/10 text-primary border border-primary/20',                              icon: 'warning' },
  unknown: { label: 'Unknown',  pill: 'bg-surface-container text-on-surface-variant/60 border border-outline-variant/10', icon: 'help' },
};

const STATUS_DOT: Record<NpcStatus, string> = {
  alive:   'bg-secondary',
  dead:    'bg-outline-variant',
  missing: 'bg-on-surface-variant',
  unknown: 'bg-outline',
  hostile: 'bg-primary animate-pulse',
};

// ── Add Member Panel ─────────────────────────────────────────────────────────

interface AddMemberPanelProps {
  onClose: () => void;
  groupId: string;
  nonMembers: NPC[];
}

function AddMemberPanel({ onClose, groupId, nonMembers }: AddMemberPanelProps) {
  const saveNpc = useSaveNpc();
  const [search, setSearch] = useState('');
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const [role, setRole] = useState('');

  const filtered = nonMembers.filter((n) =>
    !search || n.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedNpc) return;
    const updated: NPC = {
      ...selectedNpc,
      groupMemberships: [
        ...selectedNpc.groupMemberships,
        { npcId: selectedNpc.id, groupId, relation: role.trim() || undefined },
      ],
      updatedAt: new Date().toISOString(),
    };
    saveNpc.mutate(updated, { onSuccess: onClose });
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-md flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Add Member</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              Select an NPC to add to this group
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-8 pt-5 pb-3 flex-shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
            <input
              type="text"
              placeholder="Search NPCs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-3 py-2 bg-surface-container border border-outline-variant/20 focus:border-primary rounded-sm text-on-surface text-sm placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* NPC list */}
        <div className="flex-1 overflow-y-auto px-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
          {filtered.length === 0 ? (
            <p className="text-sm text-on-surface-variant/40 italic py-6 text-center">
              {nonMembers.length === 0 ? 'All NPCs are already members.' : 'No NPCs found.'}
            </p>
          ) : (
            <div className="space-y-1 py-2">
              {filtered.map((npc) => {
                const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                const dot = STATUS_DOT[npc.status];
                const isSelected = selectedNpc?.id === npc.id;
                return (
                  <button
                    key={npc.id}
                    type="button"
                    onClick={() => setSelectedNpc(isSelected ? null : npc)}
                    className={`w-full flex items-center gap-3 p-3 rounded-sm border transition-all text-left ${
                      isSelected
                        ? 'bg-primary/8 border-primary/30'
                        : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container hover:border-outline-variant/30'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-9 h-9 rounded-sm flex items-center justify-center border ${isSelected ? 'bg-primary/10 border-primary/30' : 'bg-surface-container-highest border-outline-variant/20'}`}>
                        <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant/60'}`}>{initials}</span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-surface-container-low ${dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{npc.name}</p>
                      {npc.species && (
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">{npc.species}</p>
                      )}
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-[18px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Role field + footer */}
        <div className="px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest space-y-4">
          {selectedNpc && (
            <div>
              <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5">
                Role / Relation <span className="normal-case tracking-normal text-on-surface-variant/40 font-normal">optional</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Leader, Spy, Recruit…"
                className="w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
              />
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedNpc || saveNpc.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {saveNpc.isPending
                ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-sm">person_add</span>}
              Add Member
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GroupDetailPage() {
  const { id: campaignId, groupId } = useParams<{ id: string; groupId: string }>();
  const { data: group, isLoading, isError } = useGroup(campaignId ?? '', groupId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: groupTypes } = useGroupTypes();
  const saveNpc = useSaveNpc();

  const members = (allNpcs ?? [])
    .filter((n) => n.groupMemberships.some((m) => m.groupId === groupId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const nonMembers = (allNpcs ?? [])
    .filter((n) => !n.groupMemberships.some((m) => m.groupId === groupId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const saveGroup = useSaveGroup();

  const handleGroupImageUpload = (dataUrl: string) => {
    saveGroup.mutate({ ...group!, image: dataUrl, updatedAt: new Date().toISOString() });
  };

  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const handleRemoveMember = (npc: NPC) => {
    const updated: NPC = {
      ...npc,
      groupMemberships: npc.groupMemberships.filter((m) => m.groupId !== groupId),
      updatedAt: new Date().toISOString(),
    };
    saveNpc.mutate(updated);
  };

  const tc = groupTypes?.find((t) => t.id === group?.type) ?? { name: group?.type ?? '', icon: 'category' };
  const relation = group?.partyRelation ? (RELATION_CONFIG[group.partyRelation] ?? RELATION_CONFIG.unknown) : null;

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !group) {
    return <main className="p-12 text-on-surface-variant text-sm">Group not found.</main>;
  }

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/groups`}>Groups</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            <ImageUpload
              image={group.image}
              name={group.name}
              className="w-full aspect-[21/9]"
              onUpload={handleGroupImageUpload}
            />

            {/* Header */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[13px]">{tc.icon}</span>
                  {tc.name}
                </span>
                {relation && (
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${relation.pill}`}>
                    <span className="material-symbols-outlined text-[13px]">{relation.icon}</span>
                    {relation.label}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                {group.name}
              </h1>
              {group.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {group.aliases.map((alias) => (
                    <span key={alias} className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic">
                      "{alias}"
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Description */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">About</h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              <p className="text-on-surface-variant leading-loose text-base">{group.description}</p>
            </section>

            {/* Goals */}
            {group.goals && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">Goals</h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="bg-surface-container-low p-6 border-l-2 border-primary/30">
                  <p className="text-on-surface-variant leading-relaxed italic">{group.goals}</p>
                </div>
              </section>
            )}

            {/* Symbols */}
            {group.symbols && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">Symbols & Insignia</h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <p className="text-on-surface-variant leading-relaxed">{group.symbols}</p>
              </section>
            )}

            {/* Members */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Members
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                {members.length > 0 && (
                  <span className="text-xs font-bold text-on-surface-variant/40">{members.length}</span>
                )}
                <button
                  onClick={() => setAddMemberOpen(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">person_add</span>
                  Add
                </button>
              </div>
              {members.length === 0 ? (
                <p className="text-sm text-on-surface-variant/40 italic">No members yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((npc) => {
                    const membership = npc.groupMemberships.find((m) => m.groupId === groupId);
                    const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                    const dot = STATUS_DOT[npc.status];
                    return (
                      <div key={npc.id} className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 hover:border-outline-variant/30 transition-all group">
                        <Link
                          to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                          className="flex items-center gap-3 flex-1 min-w-0"
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-low ${dot}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                              {npc.name}
                            </p>
                            <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                              {[npc.species, membership?.relation].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </Link>
                        {confirmRemoveId === npc.id ? (
                          <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5 flex-shrink-0">
                            <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                            <button
                              onClick={() => { handleRemoveMember(npc); setConfirmRemoveId(null); }}
                              disabled={saveNpc.isPending}
                              className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors disabled:opacity-40"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(null)}
                              className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveId(npc.id)}
                            title="Remove from group"
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 px-2 py-1 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-all"
                          >
                            <span className="material-symbols-outlined text-[16px]">person_remove</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* GM Notes */}
            <GmNotesSection notes={group.gmNotes} fallback={`No GM notes for ${group.name} yet.`} />

            {/* Social Relations */}
            <SocialRelationsSection
              campaignId={campaignId ?? ''}
              entityId={groupId ?? ''}
            />
          </div>

          {/* ── Right column (35%) ──────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            <div className="flex justify-end">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Group
              </button>
            </div>

          </div>

        </div>
      </div>

      <GroupEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId ?? ''}
        group={group}
      />

      {addMemberOpen && (
        <AddMemberPanel
          onClose={() => setAddMemberOpen(false)}
          groupId={groupId ?? ''}
          nonMembers={nonMembers}
        />
      )}
    </main>
  );
}
