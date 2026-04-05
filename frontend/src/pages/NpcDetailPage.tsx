import { useState, useCallback, memo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useNpc, useNpcs, useSaveNpc, useDeleteNpc, useAddNPCGroupMembership, useRemoveNPCGroupMembership, useAddNPCLocationPresence, useRemoveNPCLocationPresence, useSetNPCGroupMembershipVisibility, useSetNPCLocationPresenceVisibility } from '@/features/npcs/api/queries';
import { useGroups } from '@/features/groups/api';
import { useLocations } from '@/features/locations/api';
import { useSessions } from '@/features/sessions/api';
import { useQuests, useSetQuestVisibility } from '@/features/quests/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { NpcEditDrawer } from '@/features/npcs/ui';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, InlineRichField, LocationIcon, SectionBackground, SectionDisabled, VisibilityPanel } from '@/shared/ui';
import { useCampaign } from '@/features/campaigns/api/queries';
import { useSetNpcVisibility } from '@/features/npcs/api/queries';
import { NPC_VISIBILITY_FIELDS, NPC_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import { uploadFile } from '@/shared/api/uploadFile';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { NPC, NpcStatus, NpcRelationType } from '@/entities/npc';

/** Isolated portrait — only re-renders when image or name actually change */
const NpcPortrait = memo(function NpcPortrait({ image, name }: { image?: string | null; name: string }) {
  const resolved = resolveImageUrl(image);
  const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="relative w-36 sm:w-48 h-48 sm:h-64 rounded-sm bg-surface-container-low flex items-center justify-center overflow-hidden">
      {resolved ? (
        <>
          <img src={resolved} aria-hidden alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 pointer-events-none" />
          <img src={resolved} alt={name} className="relative w-full h-full object-contain drop-shadow-2xl" />
        </>
      ) : (
        <span className="font-headline text-[8rem] font-bold text-on-surface-variant/10 select-none leading-none">
          {initials}
        </span>
      )}
    </div>
  );
});

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
  alive:   { pill: 'bg-primary/10 text-primary border border-primary/20',                                          label: 'Alive'   },
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
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const saveNpc = useSaveNpc();
  const deleteNpc = useDeleteNpc();
  const setNpcVisibility = useSetNpcVisibility();
  const navigate = useNavigate();
  const addGroupMembership = useAddNPCGroupMembership();
  const removeGroupMembership = useRemoveNPCGroupMembership();
  const addLocationPresence = useAddNPCLocationPresence();
  const removeLocationPresence = useRemoveNPCLocationPresence();
  const setGroupMembershipVisibility = useSetNPCGroupMembershipVisibility();
  const setLocationPresenceVisibility = useSetNPCLocationPresenceVisibility();
  const setQuestVisibility = useSetQuestVisibility();
  const [imgVersion, setImgVersion] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

  const handleImageUpload = useCallback(async (file: File) => {
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
  }, [campaignId, npc, saveNpc, refetch]);

  const handleViewImage = useCallback(() => setLightbox(true), []);

  const groupNameById = (id: string) => groups?.find((g) => g.id === id)?.name ?? id;

  if (!npcsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  if (isLoading && !npc) {
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
    <>
    <SectionBackground />
    <main className="flex-1 min-h-screen relative z-10">
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
        {/* ── Header: portrait + identity (full width) ── */}
        <section className="relative flex flex-col sm:flex-row gap-8 items-start mb-8 bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8">
          <div className="relative group flex-shrink-0">
            <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            {isGm ? (
              <ImageUpload
                image={resolveImageUrl(npc.image, imgVersion)}
                name={npc.name}
                className="relative w-36 sm:w-48 h-48 sm:h-64"
                onUpload={handleImageUpload}
                onView={handleViewImage}
              />
            ) : (
              <NpcPortrait image={npc.image} name={npc.name} />
            )}
          </div>

          <div className="flex-1 pt-4 space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm ${st.pill}`}>
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
            {isGm && (
              <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
                {confirmDelete ? (
                  <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                    <span className="text-[9px] text-on-surface-variant">Delete?</span>
                    <button onClick={() => deleteNpc.mutate({ campaignId: campaignId!, npcId: npc.id }, { onSuccess: () => navigate(`/campaigns/${campaignId}/npcs`) })}
                      className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">Yes</button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)}
                    className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit
                </button>
              </div>
            )}
            <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
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

        {/* ── Two-column layout ── */}
        <div className="flex flex-col md:flex-row gap-8 min-w-0">

          {/* ── Left column (60-65%) — character description ── */}
          <div className="flex-1 min-w-0 space-y-8">

            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <InlineRichField label="Appearance" value={npc.appearance}
                onSave={(html) => saveField('appearance', html)}
                placeholder="Physical description…"
                readOnly={!isGm} />
            </div>

            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <InlineRichField label="Background" value={npc.description}
                onSave={(html) => saveField('description', html)}
                placeholder="History, role, key facts…"
                readOnly={!isGm} />
            </div>

            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <InlineRichField label="Personality" value={npc.personality}
                onSave={(html) => saveField('personality', html)}
                placeholder="Traits, mannerisms, quirks…"
                readOnly={!isGm} />
            </div>

            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <InlineRichField label="Motivation & Ideals" value={npc.motivation}
                onSave={(html) => saveField('motivation', html)}
                placeholder="What drives them, what they believe in…"
                readOnly={!isGm} />
            </div>

            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <InlineRichField label="Flaws" value={npc.flaws}
                onSave={(html) => saveField('flaws', html)}
                placeholder="Weaknesses, vices, fears…"
                readOnly={!isGm} />
            </div>

            {isGm && (
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                <InlineRichField label="GM Notes" value={npc.gmNotes}
                  onSave={(html) => saveField('gmNotes', html)}
                  isGmNotes />
              </div>
            )}

          </div>

          {/* ── Right column (35-40%) — relationships & connections ── */}
          <div className="md:w-[40%] lg:w-[35%] min-w-0 space-y-8 self-start bg-surface-container border border-outline-variant/20 rounded-sm p-6">

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
                <section className="space-y-8 min-w-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
                      Group Memberships
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    {isGm && (
                    <button
                      onClick={() => { setAddGroupOpen((v) => !v); setAddGroupSearch(''); setAddGroupRole(''); setSelectedGroupId(null); }}
                      className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">group_add</span>
                      Add
                    </button>
                    )}
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
                    <div className="grid grid-cols-1 gap-2">
                      {[...npc.groupMemberships].sort((a, b) => groupNameById(a.groupId).localeCompare(groupNameById(b.groupId))).map((m) => (
                        <div key={m.groupId} className="group/card flex items-stretch bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 rounded-sm overflow-hidden transition-all">
                          <Link
                            to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                            className="group flex items-center flex-1 min-w-0 px-3 py-2.5 gap-2.5"
                          >
                            <span className="material-symbols-outlined text-primary flex-shrink-0 text-[18px]">groups</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                                {m.subfaction ?? groupNameById(m.groupId)}
                              </p>
                              {m.relation && (
                                <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-wider truncate">
                                  {m.relation}
                                </p>
                              )}
                            </div>
                          </Link>
                          {isGm && (confirmRemoveGroupId === m.groupId ? (
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
                          ))}
                          {isGm && (
                            <button
                              onClick={() => setGroupMembershipVisibility.mutate({ npcId: npc.id, groupId: m.groupId, playerVisible: !(m.playerVisible ?? true) })}
                              title={m.playerVisible === false ? 'Hidden from players — click to show' : 'Visible to players — click to hide'}
                              className={`px-2 py-3 border-l border-outline-variant/10 transition-colors ${
                                m.playerVisible === false
                                  ? 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                                  : 'text-primary/60 hover:text-primary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {m.playerVisible === false ? 'visibility_off' : 'visibility'}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })()}

            {/* Locations section */}
            {locationsEnabled && (() => {
              const presences = npc.locationPresences ?? [];
              const linkedLocations = presences
                .map((p) => allLocations?.find((l) => l.id === p.locationId))
                .filter(Boolean)
                .sort((a, b) => a!.name.localeCompare(b!.name)) as NonNullable<typeof allLocations>[number][];

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
                <section className="space-y-8 min-w-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
                      Locations
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                    {isGm && (
                    <button
                      onClick={() => { setAddLocOpen((v) => !v); setAddLocSearch(''); }}
                      className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[13px]">add_location</span>
                      Add
                    </button>
                    )}
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
                          <div key={loc.id} className="bg-surface-container-low border border-outline-variant/10 rounded-sm overflow-hidden group/card">
                            <div className="flex items-stretch min-w-0">
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
                              {isGm && (confirmRemoveLocId === loc.id ? (
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
                              ))}
                              {isGm && (
                                <button
                                  onClick={() => setLocationPresenceVisibility.mutate({ npcId: npc.id, locationId: loc.id, playerVisible: !(presence?.playerVisible ?? true) })}
                                  title={presence?.playerVisible === false ? 'Hidden from players — click to show' : 'Visible to players — click to hide'}
                                  className={`px-2 border-l border-outline-variant/10 transition-colors ${
                                    presence?.playerVisible === false
                                      ? 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                                      : 'text-primary/60 hover:text-primary'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {presence?.playerVisible === false ? 'visibility_off' : 'visibility'}
                                  </span>
                                </button>
                              )}
                            </div>
                            {/* Presence note */}
                            {isGm && isEditingNote ? (
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
                              <div className="px-3 pb-2.5 flex items-center gap-1.5">
                                {presence?.note ? (
                                  <p className="text-[11px] text-on-surface-variant/60 italic flex-1">{presence.note}</p>
                                ) : isGm ? (
                                  <p
                                    className="text-[10px] text-on-surface-variant/20 italic flex-1 cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity"
                                    onClick={() => { setEditingNoteForLocId(loc.id); setNoteInput(''); }}
                                  >
                                    Add presence note…
                                  </p>
                                ) : null}
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

            {/* Quests (given by this NPC) */}
            {questsEnabled && (() => {
              const npcQuests = (allQuests ?? []).filter((q) => q.giverId === npcId).sort((a, b) => a.title.localeCompare(b.title));
              if (npcQuests.length === 0) return null;
              const statusDot: Record<string, string> = {
                active: 'bg-secondary', completed: 'bg-emerald-400', failed: 'bg-rose-400',
                unavailable: 'bg-outline-variant', undiscovered: 'bg-on-surface-variant/20',
              };
              return (
                <section className="space-y-8 min-w-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
                      Quests
                    </h2>
                    <div className="h-px flex-1 bg-outline-variant/20" />
                  </div>
                  <div className="space-y-2">
                    {npcQuests.map((q) => (
                      <div key={q.id} className="flex items-stretch bg-surface-container-low border border-outline-variant/10 rounded-sm overflow-hidden group/card">
                        <Link
                          to={`/campaigns/${campaignId}/quests/${q.id}`}
                          className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
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
                        {isGm && (
                          <button
                            onClick={() => setQuestVisibility.mutate({
                              campaignId: campaignId!,
                              id: q.id,
                              playerVisible: !q.playerVisible,
                              playerVisibleFields: q.playerVisibleFields ?? [],
                            })}
                            title={q.playerVisible ? 'Visible to players — click to hide' : 'Hidden from players — click to show'}
                            className={`px-2 border-l border-outline-variant/10 transition-colors ${
                              q.playerVisible
                                ? 'text-primary/60 hover:text-primary'
                                : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {q.playerVisible ? 'visibility' : 'visibility_off'}
                            </span>
                          </button>
                        )}
                      </div>
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
                <section className="space-y-8 min-w-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
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
                          className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 rounded-sm overflow-hidden transition-all"
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

            {/* Direct Relations */}
            {resolvedRelations.length > 0 && (
              <section className="space-y-8 min-w-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
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
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/10">
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
            {isGm && <SocialRelationsSection campaignId={campaignId ?? ''} entityId={npcId ?? ''} />}

            {/* Player Visibility */}
            {isGm && npc && (
              <VisibilityPanel
                playerVisible={npc.playerVisible ?? false}
                playerVisibleFields={npc.playerVisibleFields ?? []}
                fields={NPC_VISIBILITY_FIELDS}
                basicPreset={NPC_BASIC_PRESET}
                onToggleVisible={(v) => setNpcVisibility.mutate({
                  campaignId: campaignId!, id: npc.id,
                  playerVisible: v, playerVisibleFields: npc.playerVisibleFields ?? [],
                })}
                onToggleField={(f, on) => {
                  const fields = on
                    ? [...(npc.playerVisibleFields ?? []), f]
                    : (npc.playerVisibleFields ?? []).filter((x) => x !== f);
                  setNpcVisibility.mutate({
                    campaignId: campaignId!, id: npc.id,
                    playerVisible: npc.playerVisible ?? false, playerVisibleFields: fields,
                  });
                }}
                onSetPreset={(fields) => setNpcVisibility.mutate({
                  campaignId: campaignId!, id: npc.id,
                  playerVisible: npc.playerVisible ?? false, playerVisibleFields: fields,
                })}
                isPending={setNpcVisibility.isPending}
              />
            )}

          </div>

        </div>
      </div>

    </main>

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
    </>
  );
}
