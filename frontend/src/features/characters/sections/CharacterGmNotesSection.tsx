/**
 * Character GM notes panel — only visible to the GM.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
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
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <InlineRichField
        label={t('detail.section_gm_notes')}
        value={character.gmNotes}
        isGmNotes
        onSave={(html) => onSaveField('gmNotes', html)}
      />
    </div>
  );
}
