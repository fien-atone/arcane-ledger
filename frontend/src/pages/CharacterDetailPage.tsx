import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useParty, useSaveCharacter, useDeleteCharacter, useAddCharacterGroupMembership, useRemoveCharacterGroupMembership } from '@/features/characters/api/queries';
import { CharacterEditDrawer } from '@/features/characters/ui';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useGroups } from '@/features/groups/api';
import { useSpecies } from '@/features/species/api';
import { SocialRelationsSection } from '@/features/relations/ui';
import { ImageUpload, BackLink, InlineRichField, SectionDisabled } from '@/shared/ui';
import { uploadFile } from '@/shared/api/uploadFile';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { PlayerCharacter } from '@/entities/character';

export default function CharacterDetailPage() {
  const { id: campaignId, charId } = useParams<{ id: string; charId: string }>();
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const partyEnabled = useSectionEnabled(campaignId ?? '', 'party');
  const groupsEnabled = useSectionEnabled(campaignId ?? '', 'groups');
  const speciesEnabled = useSectionEnabled(campaignId ?? '', 'species');
  const { data: characters, isLoading, isError, refetch } = useParty(campaignId ?? '');
  const character = characters?.find((c) => c.id === charId);
  const { data: allSpecies } = useSpecies(campaignId ?? '');
  const { data: groups } = useGroups(campaignId ?? '');
  const saveCharacter = useSaveCharacter();
  const deleteCharacter = useDeleteCharacter();
  const navigate = useNavigate();
  const addGroupMembership = useAddCharacterGroupMembership();
  const removeGroupMembership = useRemoveCharacterGroupMembership();
  const [imgVersion, setImgVersion] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupSearch, setAddGroupSearch] = useState('');
  const [addGroupRole, setAddGroupRole] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [confirmRemoveGroupId, setConfirmRemoveGroupId] = useState<string | null>(null);

  const saveField = useCallback((field: keyof PlayerCharacter, html: string) => {
    if (!character) return;
    if (html.trim() === (String(character[field] ?? '')).trim()) return;
    saveCharacter.mutate({
      ...character,
      [field]: html.trim() || undefined,
      updatedAt: new Date().toISOString(),
    } as PlayerCharacter);
  }, [character, saveCharacter]);

  const handleImageUpload = async (file: File) => {
    if (import.meta.env.VITE_USE_MOCK !== 'false') {
      const reader = new FileReader();
      reader.onload = (ev) => saveCharacter.mutate({ ...character!, image: ev.target?.result as string, updatedAt: new Date().toISOString() });
      reader.readAsDataURL(file);
      return;
    }
    try {
      await uploadFile(campaignId!, 'character', character!.id, file);
      setImgVersion((v) => v + 1);
      refetch();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  if (!partyEnabled) {
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

  if (isError || !character) {
    return (
      <main className="p-12">
        <BackLink to={`/campaigns/${campaignId}/party`}>Party</BackLink>
        <p className="text-tertiary text-sm">Character not found.</p>
      </main>
    );
  }

  const matchedSpecies = speciesEnabled
    ? allSpecies?.find((s) => s.id === character.speciesId || s.name.toLowerCase() === character.species?.toLowerCase())
    : undefined;
  const displaySpecies = speciesEnabled ? (matchedSpecies?.name ?? character.species) : undefined;
  const displayGender = character.gender === 'nonbinary'
    ? 'Non-binary'
    : character.gender
      ? character.gender.charAt(0).toUpperCase() + character.gender.slice(1)
      : undefined;

  const demoBadge = [displaySpecies, displayGender, character.class, character.age != null ? `Age ${character.age}` : null]
    .filter(Boolean).join(' · ');

  return (
    <main className="flex-1 min-h-screen bg-surface">
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/party`}>Party</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            <section className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-primary/20 -translate-x-2 translate-y-2 rounded-sm group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <ImageUpload
                  image={resolveImageUrl(character.image, imgVersion)}
                  name={character.name}
                  className="relative w-48 h-64"
                  onUpload={handleImageUpload}
                  onView={character.image ? () => setLightbox(true) : undefined}
                />
              </div>

              <div className="flex-1 pt-4 space-y-4">
                {demoBadge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">person</span>
                    {demoBadge}
                  </span>
                )}
                <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                  {character.name}
                </h1>
              </div>
            </section>

            {isGm && (
              <InlineRichField label="GM Notes" value={character.gmNotes} isGmNotes
                onSave={(html) => saveField('gmNotes', html)} />
            )}
            <InlineRichField label="Backstory" value={character.background}
              onSave={(html) => saveField('background', html)}
              placeholder="History, origin, key events…" />

            {/* Group Memberships */}
            {groupsEnabled && (() => {
              const memberGroupIds = new Set((character.groupMemberships ?? []).map((m) => m.groupId));
              const availableGroups = (groups ?? [])
                .filter((g) => !memberGroupIds.has(g.id))
                .filter((g) => !addGroupSearch.trim() || g.name.toLowerCase().includes(addGroupSearch.toLowerCase()))
                .sort((a, b) => a.name.localeCompare(b.name));

              const groupNameById = (id: string) => groups?.find((g) => g.id === id)?.name ?? id;

              const handleAddGroup = () => {
                if (!selectedGroupId) return;
                addGroupMembership.mutate(
                  { characterId: character.id, groupId: selectedGroupId, relation: addGroupRole.trim() || undefined },
                  { onSuccess: () => { setAddGroupOpen(false); setAddGroupSearch(''); setAddGroupRole(''); setSelectedGroupId(null); } },
                );
              };

              const handleRemoveGroup = (groupId: string) => {
                removeGroupMembership.mutate({ characterId: character.id, groupId });
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

                  {(character.groupMemberships ?? []).length === 0 && !addGroupOpen ? (
                    <p className="text-xs text-on-surface-variant/40 italic">No group memberships.</p>
                  ) : (character.groupMemberships ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {(character.groupMemberships ?? []).map((m) => (
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

            <SocialRelationsSection campaignId={campaignId ?? ''} entityId={charId ?? ''} />
          </div>

          {/* ── Right column ────────────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            {isGm && (
              <div className="flex justify-end gap-2">
                {confirmDelete ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
                    <span className="text-[10px] text-on-surface-variant">Delete this character?</span>
                    <button onClick={() => deleteCharacter.mutate({ campaignId: campaignId!, charId: character.id }, { onSuccess: () => navigate(`/campaigns/${campaignId}/party`) })}
                      className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">Yes</button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant/40 text-xs font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
                <button onClick={() => setDetailsOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary hover:border-primary/50 text-xs font-label uppercase tracking-widest rounded-sm transition-colors">
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit
                </button>
              </div>
            )}

            <InlineRichField label="Appearance" value={character.appearance}
              onSave={(html) => saveField('appearance', html)}
              placeholder="Physical description…" />
            <InlineRichField label="Personality" value={character.personality}
              onSave={(html) => saveField('personality', html)}
              placeholder="Traits, mannerisms, quirks…" />
            <InlineRichField label="Motivation & Ideals" value={character.motivation}
              onSave={(html) => saveField('motivation', html)}
              placeholder="What drives them, what they believe in…" />
            <InlineRichField label="Bonds" value={character.bonds}
              onSave={(html) => saveField('bonds', html)}
              placeholder="People, places, things they hold dear…" />
            <InlineRichField label="Flaws" value={character.flaws}
              onSave={(html) => saveField('flaws', html)}
              placeholder="Weaknesses, vices, fears…" />

          </div>
        </div>
      </div>

      <CharacterEditDrawer
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        campaignId={campaignId ?? ''}
        character={character}
      />

      {lightbox && character.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(false)}
        >
          <img
            src={resolveImageUrl(character.image, imgVersion)}
            alt={character.name}
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
