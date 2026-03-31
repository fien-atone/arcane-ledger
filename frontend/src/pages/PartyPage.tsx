import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useParty } from '@/features/characters/api/queries';
import { CharacterEditDrawer } from '@/features/characters/ui';
import {
  usePartySlots,
  useCampaignInvitations,
  useCancelInvitation,
  useAssignCharacterToPlayer,
  useRemoveCampaignMember,
} from '@/features/invitations/api/queries';
import { InvitePanel } from '@/features/invitations/ui/InvitePanel';
import { useSpecies } from '@/features/species/api';
import { useGroups } from '@/features/groups/api';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { RichContent, EmptyState, SectionDisabled, Select } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';
import type { PartySlot } from '@/entities/partySlot';

// ── Inline confirm helper ─────────────────────────────────────────

function useInlineConfirm() {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  return {
    confirmingId,
    startConfirm: (id: string) => setConfirmingId(id),
    cancel: () => setConfirmingId(null),
    isConfirming: (id: string) => confirmingId === id,
  };
}

// ── Section header ────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary whitespace-nowrap">{title}</h3>
      <div className="h-px flex-1 bg-outline-variant/20" />
      {count != null && <span className="text-[10px] text-on-surface-variant/30">{count}</span>}
    </div>
  );
}

// ── Character detail (reused from old layout) ─────────────────────

function CharacterDetail({ char, campaignId }: { char: PlayerCharacter; campaignId: string }) {
  const initials = char.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const specEnabled = useSectionEnabled(campaignId, 'species');
  const groupsEnabled = useSectionEnabled(campaignId, 'groups');
  const { data: allSpecies } = useSpecies(campaignId);
  const { data: allGroups } = useGroups(campaignId);
  const matchedSpecies = specEnabled && (char.speciesId || char.species)
    ? allSpecies?.find((s) => s.id === char.speciesId || s.name.toLowerCase() === char.species?.toLowerCase())
    : undefined;
  const displaySpeciesName = specEnabled ? (matchedSpecies?.name ?? char.species) : undefined;
  const resolvedImage = resolveImageUrl(char.image);
  const genderLabel = char.gender
    ? (char.gender === 'nonbinary' ? 'Non-binary' : char.gender.charAt(0).toUpperCase() + char.gender.slice(1))
    : null;
  const metaParts = [displaySpeciesName, char.class, genderLabel, char.age != null ? `Age ${char.age}` : null].filter(Boolean);

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="flex-shrink-0 flex gap-6 p-8 pb-6">
        <div className="w-36 h-48 rounded-sm border border-outline-variant/20 overflow-hidden bg-surface-container-low flex-shrink-0">
          {resolvedImage ? (
            <img src={resolvedImage} alt={char.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-headline text-5xl font-bold text-on-surface-variant/8 select-none leading-none">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 min-w-0">
          <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">{char.name}</h2>
          {metaParts.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container border border-outline-variant/20 rounded-sm text-[10px] font-bold uppercase tracking-widest text-on-surface-variant w-fit">
              <span className="material-symbols-outlined text-[13px]">person</span>
              {metaParts.join(' \u00b7 ')}
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-outline-variant/10 mx-8" />
      <div className="px-8 py-6 flex flex-col gap-5">
        {char.appearance && (
          <div>
            <SectionHeader title="Appearance" />
            <RichContent value={char.appearance} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}
        {char.personality && (
          <div>
            <SectionHeader title="Personality" />
            <RichContent value={char.personality} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}
        {char.background && (
          <div>
            <SectionHeader title="Background" />
            <RichContent value={char.background} className="prose-p:text-sm prose-p:text-on-surface-variant prose-p:leading-relaxed" />
          </div>
        )}
        {groupsEnabled && (char.groupMemberships ?? []).length > 0 && (
          <div>
            <SectionHeader title="Groups" />
            <div className="flex flex-wrap gap-2">
              {(char.groupMemberships ?? []).map((m) => {
                const group = allGroups?.find((g) => g.id === m.groupId);
                const label = m.subfaction ?? group?.name ?? m.groupId;
                return (
                  <Link
                    key={m.groupId}
                    to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container border border-outline-variant/15 hover:border-primary/30 rounded-sm transition-colors group"
                  >
                    <span className="material-symbols-outlined text-primary/60 text-[13px]">groups</span>
                    <span className="text-xs text-on-surface group-hover:text-primary transition-colors">{label}</span>
                    {m.relation && (
                      <span className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider">{m.relation}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Party member card ─────────────────────────────────────────────

function MemberCard({
  slot,
  campaignId,
  unassignedCharacters,
  isGm,
  onSelectCharacter,
  onCreateCharacter,
}: {
  slot: PartySlot;
  campaignId: string;
  unassignedCharacters: PlayerCharacter[];
  isGm: boolean;
  onSelectCharacter: (char: PlayerCharacter) => void;
  onCreateCharacter: () => void;
}) {
  const member = slot.member!;
  const char = slot.character;
  const assign = useAssignCharacterToPlayer();
  const kick = useRemoveCampaignMember();
  const unassignConfirm = useInlineConfirm();
  const kickConfirm = useInlineConfirm();
  const [assigning, setAssigning] = useState(false);

  const charInitials = char?.name?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '';
  const resolvedCharImage = char ? resolveImageUrl(char.image) : undefined;

  return (
    <div className="flex border border-outline-variant/10 bg-surface-container-low rounded-sm overflow-hidden">
      {/* Player side */}
      <div className="w-64 p-4 flex items-center gap-3 border-r border-outline-variant/10 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-on-surface-variant/60">
            {member.user.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">{member.user.name}</p>
          <p className="text-[10px] text-on-surface-variant/50 truncate">{member.user.email}</p>
        </div>
      </div>

      {/* Character side */}
      <div className="flex-1 p-4 flex items-center gap-3">
        {char ? (
          <>
            <div className="w-10 h-10 rounded-sm border border-outline-variant/20 overflow-hidden bg-surface-container-highest flex-shrink-0">
              {resolvedCharImage ? (
                <img src={resolvedCharImage} alt={char.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-on-surface-variant/50">{charInitials}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{char.name}</p>
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                {[char.species, char.class].filter(Boolean).join(' \u00b7 ') || '\u2014'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onSelectCharacter(char)}
                className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
                title="View character"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_full</span>
              </button>
              {isGm && (
                <>
                  {unassignConfirm.isConfirming('unassign') ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-on-surface-variant/50">Unassign?</span>
                      <button
                        onClick={() => {
                          assign.mutate({ characterId: char.id, userId: null });
                          unassignConfirm.cancel();
                        }}
                        className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-tertiary border border-tertiary/30 rounded-sm hover:bg-tertiary/10"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => unassignConfirm.cancel()}
                        className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => unassignConfirm.startConfirm('unassign')}
                      className="p-1.5 text-on-surface-variant/40 hover:text-tertiary transition-colors"
                      title="Unassign character"
                    >
                      <span className="material-symbols-outlined text-[16px]">link_off</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xs text-on-surface-variant/40 italic flex-1">No character assigned</span>
            {isGm && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {assigning ? (
                  <div className="flex items-center gap-2">
                    <div className="w-48">
                      <Select
                        value=""
                        onChange={(v) => {
                          if (v) {
                            assign.mutate({ characterId: v, userId: member.user.id });
                            setAssigning(false);
                          }
                        }}
                        placeholder="Select character..."
                        options={unassignedCharacters.map((c) => ({
                          value: c.id,
                          label: c.name,
                        }))}
                      />
                    </div>
                    <button
                      onClick={() => setAssigning(false)}
                      className="p-1 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {unassignedCharacters.length > 0 && (
                      <button
                        onClick={() => setAssigning(true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-secondary border border-secondary/30 rounded-sm hover:bg-secondary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">link</span>
                        Assign
                      </button>
                    )}
                    <button
                      onClick={onCreateCharacter}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-primary border border-primary/30 rounded-sm hover:bg-primary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span>
                      Create
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kick button */}
      {isGm && (
        <div className="flex items-center px-3 border-l border-outline-variant/10">
          {kickConfirm.isConfirming('kick') ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[8px] text-on-surface-variant/50 uppercase tracking-wider">Kick?</span>
              <button
                onClick={() => {
                  kick.mutate({ campaignId, userId: member.user.id });
                  kickConfirm.cancel();
                }}
                className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-tertiary border border-tertiary/30 rounded-sm hover:bg-tertiary/10"
              >
                Yes
              </button>
              <button
                onClick={() => kickConfirm.cancel()}
                className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => kickConfirm.startConfirm('kick')}
              className="p-1.5 text-on-surface-variant/30 hover:text-tertiary transition-colors"
              title="Remove from campaign"
            >
              <span className="material-symbols-outlined text-[16px]">person_remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Unassigned character card ─────────────────────────────────────

function UnassignedCharacterCard({
  char,
  membersWithoutCharacter,
  isGm,
  onSelectCharacter,
}: {
  char: PlayerCharacter;
  membersWithoutCharacter: { userId: string; userName: string }[];
  isGm: boolean;
  onSelectCharacter: (char: PlayerCharacter) => void;
}) {
  const assign = useAssignCharacterToPlayer();
  const [assigning, setAssigning] = useState(false);
  const initials = char.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const resolvedImage = resolveImageUrl(char.image);

  return (
    <div className="flex items-center gap-3 p-4 border border-outline-variant/10 bg-surface-container-low rounded-sm">
      <div className="w-10 h-10 rounded-sm border border-outline-variant/20 overflow-hidden bg-surface-container-highest flex-shrink-0">
        {resolvedImage ? (
          <img src={resolvedImage} alt={char.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-on-surface-variant/50">{initials}</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-on-surface truncate">{char.name}</p>
        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
          {[char.species, char.class].filter(Boolean).join(' \u00b7 ') || '\u2014'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isGm && membersWithoutCharacter.length > 0 && (
          <>
            {assigning ? (
              <div className="flex items-center gap-2">
                <div className="w-44">
                  <Select
                    value=""
                    onChange={(v) => {
                      if (v) {
                        assign.mutate({ characterId: char.id, userId: v });
                        setAssigning(false);
                      }
                    }}
                    placeholder="Select player..."
                    options={membersWithoutCharacter.map((m) => ({
                      value: m.userId,
                      label: m.userName,
                    }))}
                  />
                </div>
                <button
                  onClick={() => setAssigning(false)}
                  className="p-1 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAssigning(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-secondary border border-secondary/30 rounded-sm hover:bg-secondary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                Assign
              </button>
            )}
          </>
        )}
        <button
          onClick={() => onSelectCharacter(char)}
          className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
          title="View character"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_full</span>
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────

export default function PartyPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const partyEnabled = useSectionEnabled(campaignId ?? '', 'party');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const { data: slots, isLoading, isError } = usePartySlots(campaignId ?? '');
  const { data: invitations } = useCampaignInvitations(campaignId ?? '');
  const { data: characters } = useParty(campaignId ?? '');
  const cancelInvitation = useCancelInvitation();

  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [addCharOpen, setAddCharOpen] = useState(false);
  const [selectedChar, setSelectedChar] = useState<PlayerCharacter | null>(null);

  const cancelConfirm = useInlineConfirm();

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  // Derived data
  const memberSlots = (slots ?? []).filter((s) => s.member);
  const invitationSlots = (invitations ?? []).filter((inv) => inv.status === 'pending');
  const unassignedCharacters = (characters ?? []).filter((c) => !c.userId);
  const membersWithoutCharacter = memberSlots
    .filter((s) => !s.character)
    .map((s) => ({
      userId: s.member!.user.id,
      userName: s.member!.user.name,
    }));

  const isEmpty = memberSlots.length === 0 && invitationSlots.length === 0 && unassignedCharacters.length === 0;

  if (!partyEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-surface overflow-hidden">
      <header className="flex-shrink-0 sticky top-0 z-40 bg-surface/80 backdrop-blur-md px-10 pt-10 pb-6 border-b border-outline-variant/5">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">Party</h1>
            <p className="text-on-surface-variant text-sm mt-1">Campaign members and their characters.</p>
          </div>
          {isGm && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setInvitePanelOpen(!invitePanelOpen)}
                className="flex items-center gap-2 px-5 py-2.5 text-secondary border border-secondary/30 rounded-sm text-xs font-label uppercase tracking-widest hover:bg-secondary/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                Invite Player
              </button>
              <button
                onClick={() => setAddCharOpen(true)}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="font-label text-xs uppercase tracking-widest">Add Character</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="flex items-center gap-3 p-12 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>Loading...
        </div>
      )}
      {isError && <p className="text-tertiary text-sm p-12">Failed to load party.</p>}

      {!isLoading && !isError && (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left panel — slots */}
          <div className={`${selectedChar ? 'w-[600px]' : 'flex-1'} flex-shrink-0 flex flex-col overflow-y-auto px-8 py-6 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30`}>

            {/* Invite panel */}
            {invitePanelOpen && isGm && (
              <InvitePanel campaignId={campaignId ?? ''} onClose={() => setInvitePanelOpen(false)} />
            )}

            {/* Empty state */}
            {isEmpty && (
              <div className="flex-1 flex flex-col items-center justify-center">
                <EmptyState
                  icon="groups"
                  title="No party members yet"
                  subtitle="Invite players or create characters to get started."
                />
                {isGm && (
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={() => setInvitePanelOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 text-secondary border border-secondary/30 rounded-sm text-xs font-label uppercase tracking-widest hover:bg-secondary/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      Invite Player
                    </button>
                    <button
                      onClick={() => setAddCharOpen(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-sm text-xs font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Create Character
                    </button>
                  </div>
                )}
              </div>
            )}

            {!isEmpty && (
              <>
                {/* Pending Invitations */}
                {isGm && invitationSlots.length > 0 && (
                  <section className="mb-8">
                    <SectionHeader title="Pending Invitations" count={invitationSlots.length} />
                    <div className="space-y-2">
                      {invitationSlots.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center gap-3 p-4 border border-outline-variant/10 bg-surface-container-low rounded-sm"
                        >
                          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">hourglass_top</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-on-surface font-medium truncate">{inv.user.name}</p>
                            <p className="text-[10px] text-on-surface-variant/50 truncate">{inv.user.email}</p>
                          </div>
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/20 rounded-full">
                            Pending
                          </span>
                          <div className="flex-shrink-0">
                            {cancelConfirm.isConfirming(inv.id) ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-on-surface-variant/50">Cancel?</span>
                                <button
                                  onClick={() => {
                                    cancelInvitation.mutate(inv.id);
                                    cancelConfirm.cancel();
                                  }}
                                  className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-tertiary border border-tertiary/30 rounded-sm hover:bg-tertiary/10"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => cancelConfirm.cancel()}
                                  className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => cancelConfirm.startConfirm(inv.id)}
                                className="p-1.5 text-on-surface-variant/30 hover:text-tertiary transition-colors"
                                title="Cancel invitation"
                              >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Party Members */}
                {memberSlots.length > 0 && (
                  <section className="mb-8">
                    <SectionHeader title="Party Members" count={memberSlots.length} />
                    <div className="space-y-3">
                      {memberSlots.map((slot) => (
                        <MemberCard
                          key={slot.member!.id}
                          slot={slot}
                          campaignId={campaignId ?? ''}
                          unassignedCharacters={unassignedCharacters}
                          isGm={isGm}
                          onSelectCharacter={setSelectedChar}
                          onCreateCharacter={() => setAddCharOpen(true)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Unassigned Characters */}
                {unassignedCharacters.length > 0 && (
                  <section>
                    <SectionHeader title="Unassigned Characters" count={unassignedCharacters.length} />
                    <div className="space-y-2">
                      {unassignedCharacters.map((char) => (
                        <UnassignedCharacterCard
                          key={char.id}
                          char={char}
                          membersWithoutCharacter={membersWithoutCharacter}
                          isGm={isGm}
                          onSelectCharacter={setSelectedChar}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Right panel — character detail */}
          {selectedChar && (
            <div className="flex-1 overflow-hidden relative border-l border-outline-variant/10">
              <CharacterDetail char={selectedChar} campaignId={campaignId ?? ''} />
              <div className="absolute top-3 right-4 z-20 flex items-center gap-2">
                <Link
                  to={`/campaigns/${campaignId}/characters/${selectedChar.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_full</span>
                  Open full page
                </Link>
                <button
                  onClick={() => setSelectedChar(null)}
                  className="p-2 bg-surface/80 backdrop-blur-sm border border-outline-variant/20 text-on-surface-variant hover:text-on-surface rounded-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CharacterEditDrawer
        open={addCharOpen}
        onClose={() => setAddCharOpen(false)}
        campaignId={campaignId ?? ''}
      />
    </main>
  );
}
