import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNpc, useNpcs } from '@/features/npcs/api/queries';
import { useGroups } from '@/features/groups/api';
import { NpcEditDrawer } from '@/features/npcs/ui';
import type { NpcStatus, NpcRelationType } from '@/entities/npc';

const RELATION_CONFIG: Record<NpcRelationType, { label: string; icon: string }> = {
  sibling:      { label: 'Sibling',      icon: 'people' },
  parent:       { label: 'Parent',       icon: 'person' },
  child:        { label: 'Child',        icon: 'child_care' },
  spouse:       { label: 'Spouse',       icon: 'favorite' },
  mentor:       { label: 'Mentor',       icon: 'school' },
  pupil:        { label: 'Pupil',        icon: 'auto_stories' },
  ally:         { label: 'Ally',         icon: 'handshake' },
  rival:        { label: 'Rival',        icon: 'sports_kabaddi' },
  acquaintance: { label: 'Known',        icon: 'link' },
};

const STATUS_STYLES: Record<NpcStatus, { pill: string; label: string }> = {
  alive: {
    pill: 'bg-secondary-container/30 text-secondary border border-secondary/20',
    label: 'Alive',
  },
  dead: {
    pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20',
    label: 'Dead',
  },
  missing: {
    pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',
    label: 'Missing',
  },
  unknown: {
    pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',
    label: 'Unknown',
  },
  hostile: {
    pill: 'bg-primary/10 text-primary border border-primary/20',
    label: 'Hostile',
  },
};

function NpcPortrait({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="relative group flex-shrink-0">
      <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300" />
      <div className="relative w-48 h-64 bg-surface-container border border-outline-variant/30 rounded-sm overflow-hidden flex items-center justify-center">
        <span className="font-headline text-7xl font-bold text-on-surface-variant/20 select-none">
          {initials}
        </span>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-dim to-transparent" />
      </div>
    </div>
  );
}

export default function NpcDetailPage() {
  const { id: campaignId, npcId } = useParams<{ id: string; npcId: string }>();
  const { data: npc, isLoading, isError } = useNpc(campaignId ?? '', npcId ?? '');
  const { data: groups } = useGroups(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');

  const groupNameById = (id: string) =>
    groups?.find((g) => g.id === id)?.name ?? id;
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !npc) {
    return (
      <main className="p-12">
        <p className="text-tertiary text-sm">Character not found.</p>
      </main>
    );
  }

  const st = STATUS_STYLES[npc.status];
  const resolvedRelations = (npc.relations ?? [])
    .map((rel) => ({ rel, other: allNpcs?.find((n) => n.id === rel.npcId) }))
    .filter((r): r is { rel: typeof r.rel; other: NonNullable<typeof r.other> } => !!r.other);

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Back breadcrumb */}
      <div className="px-10 pt-8">
        <Link
          to={`/campaigns/${campaignId}/npcs`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          NPC Roster
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Header: portrait + identity */}
            <section className="flex flex-col md:flex-row gap-8 items-start">
              <NpcPortrait name={npc.name} />

              <div className="flex-1 pt-4 space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${st.pill}`}>
                      {st.label}
                    </span>
                    {npc.species && (
                      <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                        {npc.species}
                      </span>
                    )}
                  </div>
                  <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                    {npc.name}
                  </h1>
                  {npc.aliases.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {npc.aliases.map((alias) => (
                        <span
                          key={alias}
                          className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic"
                        >
                          "{alias}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Appearance */}
                {npc.appearance && (
                  <div className="pt-4 border-t border-outline-variant/10">
                    <h3 className="text-[10px] font-label uppercase tracking-widest text-primary mb-3">
                      Physical Presence
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed italic max-w-xl">
                      {npc.appearance}
                    </p>
                  </div>
                )}

                {/* Personality */}
                {npc.personality && (
                  <div className="pt-4 border-t border-outline-variant/10">
                    <h3 className="text-[10px] font-label uppercase tracking-widest text-primary mb-3">
                      Personality
                    </h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed max-w-xl">
                      {npc.personality}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Description / background */}
            {npc.description && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Background
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <p className="text-on-surface-variant leading-loose text-base">
                  {npc.description}
                </p>
              </section>
            )}

            {/* Motivation */}
            {npc.motivation && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Motivation
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="bg-surface-container-low border-l-2 border-secondary/30 px-5 py-4">
                  <p className="text-on-surface-variant leading-relaxed text-sm italic">{npc.motivation}</p>
                </div>
              </section>
            )}

            {/* Flaws */}
            {npc.flaws && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-on-surface-variant/60 whitespace-nowrap">
                    Flaws
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/10" />
                </div>
                <div className="bg-surface-container-low border-l-2 border-outline-variant/30 px-5 py-4">
                  <p className="text-on-surface-variant/70 leading-relaxed text-sm">{npc.flaws}</p>
                </div>
              </section>
            )}

            {/* Group Memberships */}
            {npc.groupMemberships.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Group Memberships
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="flex flex-wrap gap-4">
                  {npc.groupMemberships.map((m) => (
                    <Link
                      key={m.groupId}
                      to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                      className="group flex items-center bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 px-4 py-3 transition-all"
                    >
                      <span className="material-symbols-outlined text-primary mr-3">groups</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          {m.subfaction ?? groupNameById(m.groupId)}
                        </span>
                        {m.relation && (
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                            {m.relation}
                          </span>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-xs text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Direct Relations */}
            {resolvedRelations.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Relations
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="space-y-2">
                  {resolvedRelations.map(({ rel, other }) => {
                    const rc = RELATION_CONFIG[rel.type];
                    const initials = other.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                    return (
                      <Link
                        key={`${rel.npcId}-${rel.type}`}
                        to={`/campaigns/${campaignId}/npcs/${other.id}`}
                        className="flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                            {other.name}
                          </p>
                          {rel.note && (
                            <p className="text-[10px] text-on-surface-variant/50 italic">{rel.note}</p>
                          )}
                        </div>
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/10 flex-shrink-0">
                          <span className="material-symbols-outlined text-[12px]">{rc.icon}</span>
                          {rc.label}
                        </span>
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60">
                          chevron_right
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Connections via shared groups */}
            {(() => {
              if (!allNpcs || npc.groupMemberships.length === 0) return null;
              const myGroupIds = new Set(npc.groupMemberships.map((m) => m.groupId));

              // For each other NPC, find shared groups
              const connections = allNpcs
                .filter((other) => other.id !== npc.id)
                .flatMap((other) => {
                  const shared = other.groupMemberships.filter((m) => myGroupIds.has(m.groupId));
                  return shared.length > 0 ? [{ npc: other, sharedGroups: shared }] : [];
                });

              if (connections.length === 0) return null;
              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Connections
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
                  <div className="space-y-2">
                    {connections.map(({ npc: other, sharedGroups }) => {
                      const initials = other.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                      return (
                        <Link
                          key={other.id}
                          to={`/campaigns/${campaignId}/npcs/${other.id}`}
                          className="flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                              {other.name}
                            </p>
                            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                              via{' '}
                              {sharedGroups.map((m) => groupNameById(m.groupId)).join(', ')}
                            </p>
                          </div>
                          {other.species && (
                            <span className="text-[10px] text-on-surface-variant/40 italic flex-shrink-0">{other.species}</span>
                          )}
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60">
                            chevron_right
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })()}

            {/* Unfilled fields summary */}
            {(() => {
              const missing = [
                { key: 'appearance', label: 'Appearance' },
                { key: 'personality', label: 'Personality' },
                { key: 'description', label: 'Background' },
                { key: 'motivation', label: 'Motivation' },
                { key: 'flaws', label: 'Flaws' },
              ].filter(({ key }) => !npc[key as keyof typeof npc]);
              if (missing.length === 0) return null;
              return (
                <section className="border-t border-outline-variant/10 pt-6">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/30 font-bold">
                      Not recorded:
                    </span>
                    {missing.map(({ label }) => (
                      <span
                        key={label}
                        className="px-2.5 py-1 border border-dashed border-outline-variant/20 text-[10px] text-on-surface-variant/30 uppercase tracking-widest rounded-sm"
                      >
                        {label}
                      </span>
                    ))}
                    <button
                      onClick={() => setEditOpen(true)}
                      className="ml-auto text-[10px] text-primary/40 hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[12px]">edit</span>
                      Fill in
                    </button>
                  </div>
                </section>
              );
            })()}

            {/* Appeared in sessions — placeholder */}
            <section className="pt-8 opacity-60">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xs font-label font-bold tracking-[0.2em] uppercase text-on-surface-variant whitespace-nowrap">
                  Recorded Encounters
                </h2>
                <div className="h-px flex-1 bg-outline-variant/10" />
              </div>
              <p className="text-xs text-on-surface-variant italic">
                Session log will appear here once linked.
              </p>
            </section>
          </div>

          {/* ── Right column (35%) ─────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            {/* Edit button */}
            <div className="flex justify-end">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Record
              </button>
            </div>

            {/* Location card */}
            <div className="bg-surface-container-low p-6 rounded-sm ring-1 ring-outline-variant/10 space-y-6">
              <div>
                <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-3">
                  Last Known Location
                </h4>
                {npc.locations[0] ? (
                  <div className="flex items-center gap-3 text-lg font-headline text-primary-container">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <span>{npc.locations[0]}</span>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant italic">Unknown</p>
                )}
              </div>

              {npc.locations.length > 1 && (
                <div className="space-y-3 border-t border-outline-variant/10 pt-4">
                  <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                    Frequent Haunts
                  </h4>
                  <ul className="space-y-2">
                    {npc.locations.slice(1).map((loc) => (
                      <li key={loc} className="flex items-center gap-3 text-sm text-on-surface group">
                        <span className="material-symbols-outlined text-xs text-on-surface-variant group-hover:text-primary transition-colors">
                          near_me
                        </span>
                        <span>{loc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* GM Notes */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 shadow-[4px_0_12px_rgba(242,202,80,0.15)]" />
              <div className="bg-surface-container p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-primary text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    lock
                  </span>
                  <h4 className="text-[10px] font-label uppercase tracking-widest text-primary">
                    GM Notes
                  </h4>
                </div>
                <p className="text-sm text-on-surface-variant/90 leading-relaxed italic">
                  {npc.gmNotes ?? `No GM notes for ${npc.name} yet.`}
                </p>
              </div>
            </div>

            {/* Quick stat grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-high/50 p-3 rounded-sm border border-outline-variant/10">
                <p className="text-[9px] font-label uppercase tracking-tighter text-on-surface-variant mb-1">
                  Disposition
                </p>
                <p className="text-sm font-headline text-on-surface capitalize">{npc.status}</p>
              </div>
              <div className="bg-surface-container-high/50 p-3 rounded-sm border border-outline-variant/10">
                <p className="text-[9px] font-label uppercase tracking-tighter text-on-surface-variant mb-1">
                  Groups
                </p>
                <p className="text-sm font-headline text-secondary">
                  {npc.groupMemberships.length}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit drawer */}
      <NpcEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId ?? ''}
        npc={npc}
      />
    </main>
  );
}
