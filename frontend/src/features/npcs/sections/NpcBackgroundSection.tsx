/**
 * NPC background panels — background, personality, motivation, flaws.
 * Each is an inline rich field in its own card.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { NPC } from '@/entities/npc';

interface Props {
  npc: NPC;
  isGm: boolean;
  onSaveField: (field: keyof NPC, html: string) => void;
}

export function NpcBackgroundSection({ npc, isGm, onSaveField }: Props) {
  const { t } = useTranslation('npcs');
  return (
    <>
      <SectionPanel>
        <InlineRichField label={t('section_background')} value={npc.description}
          onSave={(html) => onSaveField('description', html)}
          placeholder={t('placeholder_background')}
          readOnly={!isGm} />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField label={t('section_personality')} value={npc.personality}
          onSave={(html) => onSaveField('personality', html)}
          placeholder={t('placeholder_personality')}
          readOnly={!isGm} />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField label={t('section_motivation')} value={npc.motivation}
          onSave={(html) => onSaveField('motivation', html)}
          placeholder={t('placeholder_motivation')}
          readOnly={!isGm} />
      </SectionPanel>

      <SectionPanel>
        <InlineRichField label={t('section_flaws')} value={npc.flaws}
          onSave={(html) => onSaveField('flaws', html)}
          placeholder={t('placeholder_flaws')}
          readOnly={!isGm} />
      </SectionPanel>
    </>
  );
}
