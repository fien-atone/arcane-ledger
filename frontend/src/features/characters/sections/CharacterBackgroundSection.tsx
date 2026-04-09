/**
 * Character background panels — backstory, personality, motivation, bonds, flaws.
 *
 * These fields are gated: only the GM or the character's owning player can
 * see them. Other players viewing the character do not see this section.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  character: PlayerCharacter;
  isGm: boolean;
  canViewAll: boolean;
  onSaveField: (field: keyof PlayerCharacter, html: string) => void;
}

export function CharacterBackgroundSection({ character, isGm, canViewAll, onSaveField }: Props) {
  const { t } = useTranslation('party');
  if (!canViewAll) return null;

  return (
    <>
      <SectionPanel>
        <InlineRichField
          label={t('detail.section_backstory')}
          value={character.background}
          onSave={(html) => onSaveField('background', html)}
          placeholder={t('detail.placeholder_backstory')}
          readOnly={!isGm}
        />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField
          label={t('detail.section_personality')}
          value={character.personality}
          onSave={(html) => onSaveField('personality', html)}
          placeholder={t('detail.placeholder_personality')}
          readOnly={!isGm}
        />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField
          label={t('detail.section_motivation')}
          value={character.motivation}
          onSave={(html) => onSaveField('motivation', html)}
          placeholder={t('detail.placeholder_motivation')}
          readOnly={!isGm}
        />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField
          label={t('detail.section_bonds')}
          value={character.bonds}
          onSave={(html) => onSaveField('bonds', html)}
          placeholder={t('detail.placeholder_bonds')}
          readOnly={!isGm}
        />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField
          label={t('detail.section_flaws')}
          value={character.flaws}
          onSave={(html) => onSaveField('flaws', html)}
          placeholder={t('detail.placeholder_flaws')}
          readOnly={!isGm}
        />
      </SectionPanel>
    </>
  );
}
