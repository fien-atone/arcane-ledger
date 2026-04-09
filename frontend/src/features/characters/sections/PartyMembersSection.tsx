/**
 * PartyMembersSection — list of party members (users with PLAYER role) paired
 * with their linked character, if any.
 *
 * For GMs each row offers:
 * - Kick the member from the campaign (inline confirm)
 * - Unlink the member's current character (inline confirm)
 * - Assign an unassigned character to the member
 * - Create a new character for the member (delegated to parent via onCreateCharacter)
 *
 * Mutation hooks are colocated with the MemberCard so the section is
 * self-contained. The parent still owns the CharacterEditDrawer toggle and
 * passes a callback down so the drawer can pre-select the target user id.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Select, SectionPanel } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import {
  useAssignCharacterToPlayer,
  useRemoveCampaignMember,
} from '@/features/invitations/api/queries';
import type { PartySlot } from '@/entities/partySlot';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  slots: PartySlot[];
  campaignId: string;
  unassignedCharacters: PlayerCharacter[];
  isGm: boolean;
  onCreateCharacter: (forUserId: string) => void;
}

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
  const { t } = useTranslation('party');
  const member = slot.member!;
  const char = slot.character;
  const assign = useAssignCharacterToPlayer();
  const kick = useRemoveCampaignMember();
  const [unlinkConfirming, setUnlinkConfirming] = useState(false);
  const [kickConfirming, setKickConfirming] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const charInitials =
    char?.name
      ?.split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '';
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
            <p className="text-sm font-medium text-on-surface truncate">
              {member.user.name}
            </p>
            <p className="text-[10px] text-on-surface-variant/50 truncate">
              {member.user.email}
            </p>
          </div>
          {isGm && (
            <div className="flex-shrink-0">
              {kickConfirming ? (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-on-surface-variant/50">
                    {t('kick_confirm')}
                  </span>
                  <button
                    onClick={() => {
                      kick.mutate({ campaignId, userId: member.user.id });
                      setKickConfirming(false);
                    }}
                    className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-tertiary border border-tertiary/30 rounded-sm hover:bg-tertiary/10"
                  >
                    {t('confirm_yes')}
                  </button>
                  <button
                    onClick={() => setKickConfirming(false)}
                    className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                  >
                    {t('confirm_no')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setKickConfirming(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant/40 hover:text-tertiary hover:border-tertiary/30 border border-transparent rounded-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    person_remove
                  </span>
                  {t('kick')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center divider */}
        <div className="w-10 flex items-center justify-center border-x border-outline-variant/10">
          {char && isGm ? (
            unlinkConfirming ? (
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => {
                    assign.mutate({ characterId: char.id, userId: null });
                    setUnlinkConfirming(false);
                  }}
                  className="text-[9px] text-tertiary hover:text-tertiary/80"
                >
                  {t('confirm_yes')}
                </button>
                <button
                  onClick={() => setUnlinkConfirming(false)}
                  className="text-[9px] text-on-surface-variant/40"
                >
                  {t('confirm_no')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setUnlinkConfirming(true)}
                className="p-1 text-on-surface-variant/20 hover:text-tertiary transition-colors"
                title={t('unlink_character')}
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
                  <img
                    src={resolvedCharImage}
                    alt={char.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-on-surface-variant/50">
                      {charInitials}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">
                  {char.name}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                  {[char.species, char.class].filter(Boolean).join(' \u00b7 ') || '\u2014'}
                </p>
              </div>
              <Link
                to={`/campaigns/${campaignId}/characters/${char.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant/40 hover:text-primary hover:border-primary/30 border border-transparent rounded-sm transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                {t('view')}
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-sm border border-dashed border-outline-variant/20 bg-surface-container-highest/50 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/20">
                  person_off
                </span>
              </div>
              <span className="text-xs text-on-surface-variant/40 italic flex-1">
                {t('no_character')}
              </span>
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
                          placeholder={t('select_character')}
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
                          {t('assign')}
                        </button>
                      )}
                      <button
                        onClick={() => onCreateCharacter(member.user.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-primary border border-primary/30 rounded-sm hover:bg-primary/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        {t('create')}
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

export function PartyMembersSection({
  slots,
  campaignId,
  unassignedCharacters,
  isGm,
  onCreateCharacter,
}: Props) {
  const { t } = useTranslation('party');

  if (slots.length === 0) return null;

  return (
    <SectionPanel
      size="sm"
      title={t('section_party_members')}
      action={<span className="text-[10px] text-on-surface-variant/30">{slots.length}</span>}
    >
      {/* Column headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] mb-2 px-1">
        <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
          {t('column_player')}
        </span>
        <div className="w-[52px]" />
        <span className="text-[9px] font-label font-bold uppercase tracking-widest text-on-surface-variant/40">
          {t('column_character')}
        </span>
      </div>
      <div className="space-y-3">
        {slots.map((slot) => (
          <MemberCard
            key={slot.member!.id}
            slot={slot}
            campaignId={campaignId}
            unassignedCharacters={unassignedCharacters}
            isGm={isGm}
            onCreateCharacter={onCreateCharacter}
          />
        ))}
      </div>
    </SectionPanel>
  );
}
