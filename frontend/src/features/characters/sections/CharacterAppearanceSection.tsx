/**
 * Character appearance panel — the always-visible rich-text field.
 * GM can edit; players (and non-owner viewers) see it read-only.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  character: PlayerCharacter;
  isGm: boolean;
  onSaveField: (field: keyof PlayerCharacter, html: string) => void;
}

export function CharacterAppearanceSection({ character, isGm, onSaveField }: Props) {
  const { t } = useTranslation('party');
  return (
    <SectionPanel>
      <InlineRichField
        label={t('detail.section_appearance')}
        value={character.appearance}
        onSave={(html) => onSaveField('appearance', html)}
        placeholder={t('detail.placeholder_appearance')}
        readOnly={!isGm}
      />
    </SectionPanel>
  );
}
