/**
 * PartyMyCharacterSection — "My Character" card shown to players.
 *
 * Only rendered for non-GM viewers who have a linked character in the
 * current campaign. Displays the character's portrait, name, and species
 * and links to the character detail page.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { SectionPanel } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  campaignId: string;
  character: PlayerCharacter;
}

export function PartyMyCharacterSection({ campaignId, character }: Props) {
  const { t } = useTranslation('party');
  const resolvedImage = resolveImageUrl(character.image);
  const initials = character.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const subtitle =
    [character.species, character.class].filter(Boolean).join(' \u00b7 ') || '\u2014';

  return (
    <SectionPanel size="sm" title={t('section_my_character')}>
      <Link
        to={`/campaigns/${campaignId}/characters/${character.id}`}
        className="border border-primary/20 bg-surface-container-low rounded-sm p-4 flex items-center gap-4 hover:border-primary/40 transition-colors group"
      >
        <div className="w-14 h-14 rounded-sm border border-primary/20 overflow-hidden bg-surface-container-highest flex-shrink-0">
          {resolvedImage ? (
            <img
              src={resolvedImage}
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-bold text-primary/40">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-headline font-bold text-primary truncate group-hover:text-primary/80 transition-colors">
            {character.name}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/50 mt-0.5">
            {subtitle}
          </p>
        </div>
        <span className="material-symbols-outlined text-primary/40 text-[18px]">
          arrow_forward
        </span>
      </Link>
    </SectionPanel>
  );
}
