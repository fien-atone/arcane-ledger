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
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { EmptyState, SectionDisabled, SectionBackground, Select } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';
import { useAuthStore } from '@/features/auth';
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
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{title}</h3>
      <div className="h-px flex-1 bg-outline-variant/20" />
      {count != null && <span className="text-[10px] text-on-surface-variant/30">{count}</span>}
    </div>
  );
}

// ── Party member card ─────────────────────────────────────────────

function MemberCard({
  slot,
  campaignId,
  unassignedCharacters,
  isGm,
  onCreateCharacter,
}: {
  slot: PartySlot;
  campaignId: string;
  unassignedCharacters: PlayerCharacter[];
  isGm: boolean;
  onCreateCharacter: (forUserId: string) => void;
}) {
  const member = slot.member!;
  const char = slot.character;
  const assign = useAssignCharacterToPlayer();
  const kick = useRemoveCampaignMember();
  const unlinkConfirm = useInlineConfirm();
  const kickConfirm = useInlineConfirm();
  const [assigning, setAssigning] = useState(false);

  const charInitials = char?.name?.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '';
  const resolvedCharImage = char ? resolveImageUrl(char.image) : undefined;

  return (
    <div className="border border-outline-variant/10 bg-surface-container-low rounded-sm">
      <div className="grid grid-cols-[1fr_auto_1fr]">
        {/* Player column */}
        <div className="p-4 flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-on-surface-variant/60">
              {member.user.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-on-surface truncate">{member.user.name}</p>
            <p className="text-[10px] text-on-surface-variant/50 truncate">{member.user.email}</p>
          </div>
          {isGm && (
            <div className="flex-shrink-0">
              {kickConfirm.isConfirming('kick') ? (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-on-surface-variant/50">Kick?</span>
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
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant/40 hover:text-tertiary hover:border-tertiary/30 border border-transparent rounded-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">person_remove</span>
                  Kick
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center divider */}
        <div className="w-10 flex items-center justify-center border-x border-outline-variant/10">
          {char && isGm ? (
            unlinkConfirm.isConfirming('unlink') ? (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => { assign.mutate({ characterId: char.id, userId: null }); unlinkConfirm.cancel(); }}
                  className="text-[9px] text-tertiary hover:text-tertiary/80"
                >Yes</button>
                <button
                  onClick={() => unlinkConfirm.cancel()}
                  className="text-[9px] text-on-surface-variant/40"
                >No</button>
              </div>
            ) : (
              <button
                onClick={() => unlinkConfirm.startConfirm('unlink')}
                className="p-1 text-on-surface-variant/20 hover:text-tertiary transition-colors"
                title="Unlink character from player"
              >
                <span className="material-symbols-outlined text-[16px]">link_off</span>
              </button>
            )
          ) : (
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant/10">
              {char ? 'link' : 'more_horiz'}
            </span>
          )}
        </div>

        {/* Character column */}
        <div className="p-4 flex items-center gap-3 min-w-0">
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
              <Link
                to={`/campaigns/${campaignId}/characters/${char.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant/40 hover:text-primary hover:border-primary/30 border border-transparent rounded-sm transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                View
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-sm border border-dashed border-outline-variant/20 bg-surface-container-highest/50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/20">person_off</span>
              </div>
              <span className="text-xs text-on-surface-variant/40 italic flex-1">No character</span>
              {isGm && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {assigning ? (
                    <div className="flex items-center gap-2">
                      <div className="w-48 relative z-10">
                        <Select
                          value=""
                          nullable={false}
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
                        onClick={() => onCreateCharacter(member.user.id)}
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
      </div>
    </div>
  );
}

// ── Unassigned character card ─────────────────────────────────────

function UnassignedCharacterCard({
  char,
  campaignId,
  membersWithoutCharacter,
  isGm,
}: {
  char: PlayerCharacter;
  campaignId: string;
  membersWithoutCharacter: { userId: string; userName: string }[];
  isGm: boolean;
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
                <div className="w-48 relative z-10">
                  <Select
                    value=""
                    nullable={false}
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
        <Link
          to={`/campaigns/${campaignId}/characters/${char.id}`}
          className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
          title="View character"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
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
  const [createForUserId, setCreateForUserId] = useState<string | null>(null);

  const cancelConfirm = useInlineConfirm();

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const currentUserId = useAuthStore((s) => s.user?.id);

  // Derived data
  const memberSlots = (slots ?? []).filter((s) => s.member);
  const mySlot = !isGm ? memberSlots.find((s) => s.member!.user.id === currentUserId) : undefined;
  const otherSlots = mySlot ? memberSlots.filter((s) => s !== mySlot) : memberSlots;
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
    <>
    <SectionBackground />
    <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? 'Campaign'}
        </Link>
      </div>

      {/* Content — single max-width container */}
      <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
        {/* Header card */}
        <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">Party</h1>
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
        </div>

        {isLoading && (
          <div className="flex items-center gap-3 p-12 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>Loading...
          </div>
        )}
        {isError && <p className="text-tertiary text-sm p-12">Failed to load party.</p>}

        {!isLoading && !isError && (
          <>
            {/* Empty state */}
            {isEmpty && (
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                <div className="flex flex-col items-center justify-center py-8">
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
              </div>
            )}

            {!isEmpty && (
              <div className="space-y-8">
                {/* My Character — shown separately for players */}
                {mySlot && mySlot.character && (
                  <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                    <SectionHeader title="My Character" />
                    <Link
                      to={`/campaigns/${campaignId}/characters/${mySlot.character.id}`}
                      className="border border-primary/20 bg-surface-container-low rounded-sm p-4 flex items-center gap-4 hover:border-primary/40 transition-colors group"
                    >
                      <div className="w-14 h-14 rounded-sm border border-primary/20 overflow-hidden bg-surface-container-highest flex-shrink-0">
                        {resolveImageUrl(mySlot.character.image) ? (
                          <img src={resolveImageUrl(mySlot.character.image)} alt={mySlot.character.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary/40">{mySlot.character.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-headline font-bold text-primary truncate group-hover:text-primary/80 transition-colors">{mySlot.character.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 mt-0.5">
                          {[mySlot.character.species, mySlot.character.class].filter(Boolean).join(' \u00b7 ') || '\u2014'}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary/40 text-[18px]">arrow_forward</span>
                    </Link>
                  </div>
                )}

                {/* Pending Invitations */}
                {invitationSlots.length > 0 && (
                  <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
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
                          {isGm && (
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
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Party Members */}
                {otherSlots.length > 0 && (
                  <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                    <SectionHeader title="Party Members" count={otherSlots.length} />
                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_auto_1fr] mb-2 px-1">
                      <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">Player</span>
                      <div className="w-[52px]" />
                      <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">Character</span>
                    </div>
                    <div className="space-y-3">
                      {otherSlots.map((slot) => (
                        <MemberCard
                          key={slot.member!.id}
                          slot={slot}
                          campaignId={campaignId ?? ''}
                          unassignedCharacters={unassignedCharacters}
                          isGm={isGm}
                          onCreateCharacter={(forUserId) => { setCreateForUserId(forUserId); setAddCharOpen(true); }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Unassigned Characters */}
                {unassignedCharacters.length > 0 && (
                  <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                    <SectionHeader title="Unassigned Characters" count={unassignedCharacters.length} />
                    <div className="space-y-2">
                      {unassignedCharacters.map((char) => (
                        <UnassignedCharacterCard
                          key={char.id}
                          char={char}
                          campaignId={campaignId ?? ''}
                          membersWithoutCharacter={membersWithoutCharacter}
                          isGm={isGm}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>{/* end max-w-5xl container */}

    </main>

    <CharacterEditDrawer
      open={addCharOpen}
      onClose={() => { setAddCharOpen(false); setCreateForUserId(null); }}
      campaignId={campaignId ?? ''}
      forUserId={createForUserId ?? undefined}
    />
    {invitePanelOpen && isGm && (
      <InvitePanel campaignId={campaignId ?? ''} onClose={() => setInvitePanelOpen(false)} />
    )}
    </>
  );
}
