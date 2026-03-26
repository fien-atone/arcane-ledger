import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNpc, useNpcs, useSaveNpc } from '@/features/npcs/api/queries';
import { useGroups } from '@/features/groups/api';
import { useLocations } from '@/features/locations/api';
import { useSessions } from '@/features/sessions/api';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, BackLink, InlineRichField, LocationIcon } from '@/shared/ui';
import type { NPC, NpcStatus, NpcRelationType } from '@/entities/npc';

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
  alive:   { pill: 'bg-secondary-container/30 text-secondary border border-secondary/20',                          label: 'Alive'   },
  dead:    { pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20',     label: 'Dead'    },
  missing: { pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20',        label: 'Missing' },
  unknown: { pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10',                  label: 'Unknown' },
  hostile: { pill: 'bg-primary/10 text-primary border border-primary/20',                                          label: 'Hostile' },
};

export default function NpcDetailPage() {
  const { id: campaignId, npcId } = useParams<{ id: string; npcId: string }>();
  const { data: npc, isLoading, isError } = useNpc(campaignId ?? '', npcId ?? '');
  const { data: groups } = useGroups(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allSpecies } = useSpecies();
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allSessions } = useSessions(campaignId ?? '');
  const saveNpc = useSaveNpc();
  const [editOpen, setEditOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [addLocSearch, setAddLocSearch] = useState('');
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [confirmRemoveLocId, setConfirmRemoveLocId] = useState<string | null>(null);
  const [editingNoteForLocId, setEditingNoteForLocId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const saveField = useCallback((field: keyof NPC, html: string) => {
    if (!npc) return;
    if (html.trim() === (String(npc[field] ?? '')).trim()) return;
    saveNpc.mutate({ ...npc, [field]: html || undefined, updatedAt: new Date().toISOString() });
  }, [npc, saveNpc]);

  const handleImageUpload = (dataUrl: string) => {
    saveNpc.mutate({ ...npc!, image: dataUrl, updatedAt: new Date().toISOString() });
  };

  const groupNameById = (id: string) => groups?.find((g) => g.id === id)?.name ?? id;

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
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/npcs`}>NPC Roster</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Header: portrait + identity */}
            <section className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <ImageUpload
                  image={npc.image}
                  name={npc.name}
                  className="relative w-48 h-64"
                  onUpload={handleImageUpload}
                  onView={npc.image ? () => setLightbox(true) : undefined}
                />
              </div>

              <div className="flex-1 pt-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${st.pill}`}>
                    {st.label}
                  </span>
                  {npc.gender && (
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                      {npc.gender === 'nonbinary' ? 'Non-binary' : npc.gender.charAt(0).toUpperCase() + npc.gender.slice(1)}
                    </span>
                  )}
                  {npc.age != null && (
                    <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                      Age {npc.age}
                    </span>
                  )}
                  {npc.species && (() => {
                    const matchedSpecies = allSpecies?.find(
                      (s) => s.id === npc.speciesId || s.name.toLowerCase() === npc.species?.toLowerCase()
                    );
                    const displayName = matchedSpecies?.name ?? npc.species;
                    return matchedSpecies ? (
                      <Link
                        to={`/campaigns/${campaignId}/species/${matchedSpecies.id}`}
                        className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10 hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        {displayName}
                      </Link>
                    ) : (
                      <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                        {displayName}
                      </span>
                    );
                  })()}
                </div>
                <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                  {npc.name}
                </h1>
                {npc.aliases.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {npc.aliases.map((alias) => (
                      <span key={alias} className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic">
                        "{alias}"
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <InlineRichField label="GM Notes" value={npc.gmNotes}
              onSave={(html) => saveField('gmNotes', html)}
              isGmNotes />

            <InlineRichField label="Background" value={npc.description}
              onSave={(html) => saveField('description', html)}
              placeholder="History, role, key facts…" />

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

            {/* Social Relations */}
            <SocialRelationsSection campaignId={campaignId ?? ''} entityId={npcId ?? ''} />

            {/* Connections via shared groups */}
            {(() => {
              if (!allNpcs || npc.groupMemberships.length === 0) return null;
              const myGroupIds = new Set(npc.groupMemberships.map((m) => m.groupId));
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
                              via {sharedGroups.map((m) => groupNameById(m.groupId)).join(', ')}
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

            {/* Session Appearances */}
            {(() => {
              const sessionAppearances = (allSessions ?? [])
                .filter((s) => s.npcIds?.includes(npcId ?? ''))
                .sort((a, b) => b.number - a.number);
              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Session Appearances
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
                  {sessionAppearances.length === 0 ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No sessions tagged yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {sessionAppearances.map((session) => (
                        <Link
                          key={session.id}
                          to={`/campaigns/${campaignId}/sessions/${session.id}`}
                          className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[18px]">auto_stories</span>
                          <p className="text-sm text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                            Session {session.number} — {session.title}
                          </p>
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              );
            })()}

          </div>

          {/* ── Right column (35%) ─────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            <div className="flex justify-end">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Record
              </button>
            </div>

            <InlineRichField label="Appearance" value={npc.appearance}
              onSave={(html) => saveField('appearance', html)}
              placeholder="Physical description…" />

            <InlineRichField label="Personality" value={npc.personality}
              onSave={(html) => saveField('personality', html)}
              placeholder="Traits, mannerisms, quirks…" />

            <InlineRichField label="Motivation & Ideals" value={npc.motivation}
              onSave={(html) => saveField('motivation', html)}
              placeholder="What drives them, what they believe in…" />

            <InlineRichField label="Flaws" value={npc.flaws}
              onSave={(html) => saveField('flaws', html)}
              placeholder="Weaknesses, vices, fears…" />

            {/* Locations section */}
            {(() => {
              const presences = npc.locationPresences ?? [];
              const linkedLocations = presences
                .map((p) => allLocations?.find((l) => l.id === p.locationId))
                .filter(Boolean) as NonNullable<typeof allLocations>[number][];

              const availableToAdd = (allLocations ?? [])
                .filter((l) => !presences.some((p) => p.locationId === l.id))
                .filter((l) => !addLocSearch.trim() || l.name.toLowerCase().includes(addLocSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const handleAddLocation = (locId: string) => {
                saveNpc.mutate({
                  ...npc,
                  locationPresences: [...presences, { locationId: locId }],
                  updatedAt: new Date().toISOString(),
                });
                setAddLocOpen(false);
                setAddLocSearch('');
              };

              const handleRemoveLocation = (locId: string) => {
                saveNpc.mutate({
                  ...npc,
                  locationPresences: presences.filter((p) => p.locationId !== locId),
                  updatedAt: new Date().toISOString(),
                });
                setConfirmRemoveLocId(null);
              };

              const handleSaveNote = (locId: string, note: string) => {
                saveNpc.mutate({
                  ...npc,
                  locationPresences: presences.map((p) =>
                    p.locationId === locId ? { ...p, note: note || undefined } : p
                  ),
                  updatedAt: new Date().toISOString(),
                });
                setEditingNoteForLocId(null);
              };

              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Locations
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    <button
                      onClick={() => { setAddLocOpen((v) => !v); setAddLocSearch(''); }}
                      className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">add_location</span>
                      Add
                    </button>
                  </div>

                  {addLocOpen && (
                    <div className="border border-outline-variant/20 bg-surface-container-low">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                        <input
                          autoFocus
                          type="text"
                          value={addLocSearch}
                          onChange={(e) => setAddLocSearch(e.target.value)}
                          placeholder="Search locations…"
                          className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {availableToAdd.length === 0 ? (
                          <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">No locations found.</p>
                        ) : availableToAdd.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => handleAddLocation(l.id)}
                            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors"
                          >
                            <LocationIcon locationType={l.type} size="text-[13px]" />
                            <span className="text-xs text-on-surface">{l.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {linkedLocations.length === 0 && !addLocOpen ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No locations linked.</p>
                  ) : linkedLocations.length > 0 ? (
                    <div className="space-y-2">
                      {linkedLocations.map((loc) => {
                        const presence = presences.find((p) => p.locationId === loc.id);
                        const isEditingNote = editingNoteForLocId === loc.id;
                        return (
                          <div key={loc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                            <div className="flex items-stretch">
                              <Link
                                to={`/campaigns/${campaignId}/locations/${loc.id}`}
                                className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
                              >
                                <LocationIcon locationType={loc.type} size="text-[16px]" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">
                                    {loc.name}
                                  </p>
                                </div>
                                <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                                  arrow_forward
                                </span>
                              </Link>
                              {confirmRemoveLocId === loc.id ? (
                                <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                                  <button
                                    onClick={() => handleRemoveLocation(loc.id)}
                                    className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() => setConfirmRemoveLocId(null)}
                                    className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmRemoveLocId(loc.id)}
                                  title="Remove from locations"
                                  className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                              )}
                            </div>
                            {/* Presence note */}
                            {isEditingNote ? (
                              <div className="px-3 pb-3 flex items-center gap-2">
                                <input
                                  autoFocus
                                  type="text"
                                  value={noteInput}
                                  onChange={(e) => setNoteInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveNote(loc.id, noteInput);
                                    if (e.key === 'Escape') setEditingNoteForLocId(null);
                                  }}
                                  placeholder="e.g. Frequents the tavern at night…"
                                  className="flex-1 bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSaveNote(loc.id, noteInput)}
                                  className="px-2 py-1 bg-primary text-on-primary text-[10px] rounded-sm uppercase tracking-wider"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingNoteForLocId(null)}
                                  className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ) : (
                              <div
                                className="px-3 pb-2.5 flex items-center gap-1.5 cursor-pointer group/note"
                                onClick={() => {
                                  setEditingNoteForLocId(loc.id);
                                  setNoteInput(presence?.note ?? '');
                                }}
                              >
                                {presence?.note ? (
                                  <p className="text-[11px] text-on-surface-variant/60 italic flex-1">{presence.note}</p>
                                ) : (
                                  <p className="text-[10px] text-on-surface-variant/20 italic flex-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                    Add presence note…
                                  </p>
                                )}
                                <span className="material-symbols-outlined text-[12px] text-on-surface-variant/20 group-hover/note:text-primary/50 transition-colors opacity-0 group-hover/note:opacity-100">
                                  edit
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })()}

          </div>

        </div>
      </div>

      <NpcEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId ?? ''}
        npc={npc}
      />

      {lightbox && npc.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <img
            src={npc.image}
            alt={npc.name}
            className="max-w-full max-h-full object-contain drop-shadow-2xl"
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>
      )}
    </main>
  );
}
