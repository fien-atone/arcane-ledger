/**
 * PartyUnassignedCharactersSection — characters in the campaign that are not
 * yet linked to any player.
 *
 * Each row shows the character's portrait + species/class and, for GMs with
 * members that currently have no character, an inline "assign to player"
 * dropdown. The assign mutation lives inside this section.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Select } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { useAssignCharacterToPlayer } from '@/features/invitations/api/queries';
import type { PlayerCharacter } from '@/entities/character';
import type { MemberWithoutCharacter } from '../hooks/usePartyPage';

interface Props {
  characters: PlayerCharacter[];
  campaignId: string;
  membersWithoutCharacter: MemberWithoutCharacter[];
  isGm: boolean;
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
        {title}
      </h3>
      <div className="h-px flex-1 bg-outline-variant/20" />
      {count != null && (
        <span className="text-[10px] text-on-surface-variant/30">{count}</span>
      )}
    </div>
  );
}

function UnassignedCharacterCard({
  char,
  campaignId,
  membersWithoutCharacter,
  isGm,
}: {
  char: PlayerCharacter;
  campaignId: string;
  membersWithoutCharacter: MemberWithoutCharacter[];
  isGm: boolean;
}) {
  const { t } = useTranslation('party');
  const assign = useAssignCharacterToPlayer();
  const [assigning, setAssigning] = useState(false);
  const initials = char.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const resolvedImage = resolveImageUrl(char.image);

  return (
    <div className="flex items-center gap-3 p-4 border border-outline-variant/10 bg-surface-container-low rounded-sm">
      <div className="w-10 h-10 rounded-sm border border-outline-variant/20 overflow-hidden bg-surface-container-highest flex-shrink-0">
        {resolvedImage ? (
          <img src={resolvedImage} alt={char.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-on-surface-variant/50">
              {initials}
            </span>
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
                    placeholder={t('select_player')}
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
                {t('assign')}
              </button>
            )}
          </>
        )}
        <Link
          to={`/campaigns/${campaignId}/characters/${char.id}`}
          className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors"
          title={t('view_character')}
        >
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

export function PartyUnassignedCharactersSection({
  characters,
  campaignId,
  membersWithoutCharacter,
  isGm,
}: Props) {
  const { t } = useTranslation('party');

  if (characters.length === 0) return null;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <SectionHeader
        title={t('section_unassigned_characters')}
        count={characters.length}
      />
      <div className="space-y-2">
        {characters.map((char) => (
          <UnassignedCharacterCard
            key={char.id}
            char={char}
            campaignId={campaignId}
            membersWithoutCharacter={membersWithoutCharacter}
            isGm={isGm}
          />
        ))}
      </div>
    </div>
  );
}
