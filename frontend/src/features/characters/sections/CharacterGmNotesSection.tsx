/**
 * Character GM notes panel — only visible to the GM.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  character: PlayerCharacter;
  isGm: boolean;
  onSaveField: (field: keyof PlayerCharacter, html: string) => void;
}

export function CharacterGmNotesSection({ character, isGm, onSaveField }: Props) {
  const { t } = useTranslation('party');
  if (!isGm) return null;
  return (
    <SectionPanel>
      <InlineRichField
        label={t('detail.section_gm_notes')}
        value={character.gmNotes}
        isGmNotes
        onSave={(html) => onSaveField('gmNotes', html)}
      />
    </SectionPanel>
  );
}
