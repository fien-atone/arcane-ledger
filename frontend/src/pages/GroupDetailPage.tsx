import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGroup } from '@/features/groups/api';
import { GroupEditDrawer } from '@/features/groups/ui';
import { useNpcs } from '@/features/npcs/api/queries';
import { useGroupTypes } from '@/features/groupTypes';
import { SocialRelationsSection } from '@/features/relations/ui';
import type { NpcStatus } from '@/entities/npc';

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

function GroupHero({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="relative w-full aspect-[21/9] overflow-hidden rounded-sm bg-surface-container-low flex items-center justify-center group">
      <span className="font-headline text-[10rem] font-bold text-on-surface-variant/10 select-none leading-none grayscale">
        {initials}
      </span>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
    </div>
  );
}

export default function GroupDetailPage() {
  const { id: campaignId, groupId } = useParams<{ id: string; groupId: string }>();
  const { data: group, isLoading, isError } = useGroup(campaignId ?? '', groupId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: groupTypes } = useGroupTypes();

  const members = (allNpcs ?? [])
    .filter((n) => n.groupMemberships.some((m) => m.groupId === groupId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const [editOpen, setEditOpen] = useState(false);

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
        <Link
          to={`/campaigns/${campaignId}/groups`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Groups
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            <GroupHero name={group.name} />

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
              </div>
              {members.length === 0 ? (
                <p className="text-sm text-on-surface-variant/40 italic">No members tagged yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((npc) => {
                    const membership = npc.groupMemberships.find((m) => m.groupId === groupId);
                    const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                    const dot = STATUS_DOT[npc.status];
                    return (
                      <Link
                        key={npc.id}
                        to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                        className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 hover:border-outline-variant/30 transition-all group"
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
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 flex-shrink-0">
                          chevron_right
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* GM Notes */}
            <section className="bg-surface-container-low p-8 border border-primary/20 rounded-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">lock</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-primary">GM Notes</h3>
                </div>
                <p className="text-on-surface-variant text-sm leading-relaxed italic">
                  {group.gmNotes ?? `No GM notes for ${group.name} yet.`}
                </p>
              </div>
            </section>

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

            {/* Profile card */}
            <div className="bg-surface-container-low p-6 rounded-sm ring-1 ring-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Group Profile</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Type</span>
                  <span className="text-on-surface font-bold">{tc.name}</span>
                </div>
                {relation && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-on-surface-variant/60 italic">Party Relation</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${relation.pill}`}>
                      {relation.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[11px]">
                  <span className="text-on-surface-variant/60 italic">Members</span>
                  <span className="text-on-surface font-bold">{members.length}</span>
                </div>
                {group.aliases.length > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-on-surface-variant/60 italic">Known Aliases</span>
                    <span className="text-on-surface">{group.aliases.length}</span>
                  </div>
                )}
              </div>
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
    </main>
  );
}
