import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNpc, useNpcs, useSaveNpc, useAddNPCGroupMembership, useRemoveNPCGroupMembership, useAddNPCLocationPresence, useRemoveNPCLocationPresence } from '@/features/npcs/api/queries';
import { useGroups } from '@/features/groups/api';
import { useLocations } from '@/features/locations/api';
import { useSessions } from '@/features/sessions/api';
import { useQuests } from '@/features/quests/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, BackLink, InlineRichField, LocationIcon, SectionDisabled } from '@/shared/ui';
import { uploadFile } from '@/shared/api/uploadFile';
import { resolveImageUrl } from '@/shared/api/imageUrl';
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
};

export default function NpcDetailPage() {
  const { id: campaignId, npcId } = useParams<{ id: string; npcId: string }>();
  const { data: npc, isLoading, isError, refetch } = useNpc(campaignId ?? '', npcId ?? '');
  const { data: groups } = useGroups(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allSpecies } = useSpecies(campaignId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allSessions } = useSessions(campaignId ?? '');
  const { data: allQuests } = useQuests(campaignId ?? '');
  const npcsEnabled = useSectionEnabled(campaignId ?? '', 'npcs');
  const sessionsEnabled = useSectionEnabled(campaignId ?? '', 'sessions');
  const questsEnabled = useSectionEnabled(campaignId ?? '', 'quests');
  const groupsEnabled = useSectionEnabled(campaignId ?? '', 'groups');
  const locationsEnabled = useSectionEnabled(campaignId ?? '', 'locations');
  const locationTypesEnabled = useSectionEnabled(campaignId ?? '', 'location_types');
  const speciesEnabled = useSectionEnabled(campaignId ?? '', 'species');
  const saveNpc = useSaveNpc();
  const addGroupMembership = useAddNPCGroupMembership();
  const removeGroupMembership = useRemoveNPCGroupMembership();
  const addLocationPresence = useAddNPCLocationPresence();
  const removeLocationPresence = useRemoveNPCLocationPresence();
  const [imgVersion, setImgVersion] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [addLocSearch, setAddLocSearch] = useState('');
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [confirmRemoveLocId, setConfirmRemoveLocId] = useState<string | null>(null);
  const [editingNoteForLocId, setEditingNoteForLocId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupSearch, setAddGroupSearch] = useState('');
  const [addGroupRole, setAddGroupRole] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [confirmRemoveGroupId, setConfirmRemoveGroupId] = useState<string | null>(null);

  const saveField = useCallback((field: keyof NPC, html: string) => {
    if (!npc) return;
    if (html.trim() === (String(npc[field] ?? '')).trim()) return;
    saveNpc.mutate({ ...npc, [field]: html || undefined, updatedAt: new Date().toISOString() });
  }, [npc, saveNpc]);

  const handleImageUpload = async (file: File) => {
    if (import.meta.env.VITE_USE_MOCK !== 'false') {
      const reader = new FileReader();
      reader.onload = (ev) => saveNpc.mutate({ ...npc!, image: ev.target?.result as string, updatedAt: new Date().toISOString() });
      reader.readAsDataURL(file);
      return;
    }
    try {
      await uploadFile(campaignId!, 'npc', npc!.id, file);
      setImgVersion((v) => v + 1);
      refetch();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const groupNameById = (id: string) => groups?.find((g) => g.id === id)?.name ?? id;

  if (!npcsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

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
                  image={resolveImageUrl(npc.image, imgVersion)}
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
                  {speciesEnabled && npc.species && (() => {
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
            {groupsEnabled && (() => {
              const memberGroupIds = new Set(npc.groupMemberships.map((m) => m.groupId));
              const availableGroups = (groups ?? [])
                .filter((g) => !memberGroupIds.has(g.id))
                .filter((g) => !addGroupSearch.trim() || g.name.toLowerCase().includes(addGroupSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const handleAddGroup = () => {
                if (!selectedGroupId) return;
                addGroupMembership.mutate(
                  { npcId: npc.id, groupId: selectedGroupId, relation: addGroupRole.trim() || undefined },
                  { onSuccess: () => { setAddGroupOpen(false); setAddGroupSearch(''); setAddGroupRole(''); setSelectedGroupId(null); } },
                );
              };

              const handleRemoveGroup = (groupId: string) => {
                removeGroupMembership.mutate({ npcId: npc.id, groupId });
                setConfirmRemoveGroupId(null);
              };

              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Group Memberships
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    <button
                      onClick={() => { setAddGroupOpen((v) => !v); setAddGroupSearch(''); setAddGroupRole(''); setSelectedGroupId(null); }}
                      className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">group_add</span>
                      Add
                    </button>
                  </div>

                  {addGroupOpen && (
                    <div className="border border-outline-variant/20 bg-surface-container-low">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                        <input
                          autoFocus
                          type="text"
                          value={addGroupSearch}
                          onChange={(e) => setAddGroupSearch(e.target.value)}
                          placeholder="Search groups…"
                          className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {availableGroups.length === 0 ? (
                          <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">
                            {(groups ?? []).length === 0 ? 'No groups in this campaign.' : 'No groups found.'}
                          </p>
                        ) : availableGroups.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => setSelectedGroupId(selectedGroupId === g.id ? null : g.id)}
                            className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                              selectedGroupId === g.id ? 'bg-primary/8 border-l-2 border-primary' : 'hover:bg-surface-container'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px] text-primary">groups</span>
                            <span className={`text-xs ${selectedGroupId === g.id ? 'text-primary font-medium' : 'text-on-surface'}`}>{g.name}</span>
                            {selectedGroupId === g.id && (
                              <span className="material-symbols-outlined text-primary text-[14px] ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {selectedGroupId && (
                        <div className="px-4 py-3 border-t border-outline-variant/20 space-y-3">
                          <div>
                            <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">
                              Role <span className="normal-case tracking-normal text-on-surface-variant/40">(optional)</span>
                            </label>
                            <input
                              type="text"
                              value={addGroupRole}
                              onChange={(e) => setAddGroupRole(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddGroup(); }}
                              placeholder="e.g. Leader, Spy…"
                              className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary rounded-sm py-1.5 px-2 text-xs text-on-surface focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
                            />
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setAddGroupOpen(false); setSelectedGroupId(null); }}
                              className="px-3 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddGroup}
                              disabled={addGroupMembership.isPending}
                              className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity"
                            >
                              <span className="material-symbols-outlined text-[13px]">group_add</span>
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {npc.groupMemberships.length === 0 && !addGroupOpen ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No group memberships.</p>
                  ) : npc.groupMemberships.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {npc.groupMemberships.map((m) => (
                        <div key={m.groupId} className="group/card flex items-center bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 transition-all">
                          <Link
                            to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                            className="group flex items-center px-4 py-3"
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
                          {confirmRemoveGroupId === m.groupId ? (
                            <div className="flex items-center gap-1 px-2 py-3 border-l border-outline-variant/10 bg-error/5">
                              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                              <button
                                onClick={() => handleRemoveGroup(m.groupId)}
                                className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmRemoveGroupId(null)}
                                className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemoveGroupId(m.groupId)}
                              title="Remove from group"
                              className="px-2 py-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })()}

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

            {/* Quests (given by this NPC) */}
            {questsEnabled && (() => {
              const npcQuests = (allQuests ?? []).filter((q) => q.giverId === npcId);
              if (npcQuests.length === 0) return null;
              const statusDot: Record<string, string> = {
                active: 'bg-secondary', completed: 'bg-emerald-400', failed: 'bg-rose-400',
                unavailable: 'bg-outline-variant', undiscovered: 'bg-on-surface-variant/20',
              };
              return (
                <section className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                      Quests
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
                  <div className="space-y-2">
                    {npcQuests.map((q) => (
                      <Link
                        key={q.id}
                        to={`/campaigns/${campaignId}/quests/${q.id}`}
                        className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[q.status] ?? 'bg-outline-variant'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{q.title}</p>
                          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                            {q.status}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">
                          arrow_forward
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Session Appearances */}
            {sessionsEnabled && (() => {
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
            {locationsEnabled && (() => {
              const presences = npc.locationPresences ?? [];
              const linkedLocations = presences
                .map((p) => allLocations?.find((l) => l.id === p.locationId))
                .filter(Boolean) as NonNullable<typeof allLocations>[number][];

              const availableToAdd = (allLocations ?? [])
                .filter((l) => !presences.some((p) => p.locationId === l.id))
                .filter((l) => !addLocSearch.trim() || l.name.toLowerCase().includes(addLocSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const handleAddLocation = (locId: string) => {
                addLocationPresence.mutate({ npcId: npc.id, locationId: locId });
                setAddLocOpen(false);
                setAddLocSearch('');
              };

              const handleRemoveLocation = (locId: string) => {
                removeLocationPresence.mutate({ npcId: npc.id, locationId: locId });
                setConfirmRemoveLocId(null);
              };

              const handleSaveNote = (locId: string, note: string) => {
                addLocationPresence.mutate({ npcId: npc.id, locationId: locId, note: note.trim() || undefined });
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
                            <LocationIcon locationType={l.type} size="text-[13px]" generic={!locationTypesEnabled} />
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
                                <LocationIcon locationType={loc.type} size="text-[16px]" generic={!locationTypesEnabled} />
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
            src={resolveImageUrl(npc.image, imgVersion)}
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
