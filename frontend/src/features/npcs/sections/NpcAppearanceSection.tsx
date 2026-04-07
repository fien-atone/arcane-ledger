/**
 * NPC appearance + GM notes panels.
 *
 * Exports two components because the original layout interleaves the
 * background sections between them: appearance is rendered first, then
 * background/personality/motivation/flaws, then gm notes at the bottom
 * of the left column.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
import type { NPC } from '@/entities/npc';

interface Props {
  npc: NPC;
  isGm: boolean;
  onSaveField: (field: keyof NPC, html: string) => void;
}

export function NpcAppearanceSection({ npc, isGm, onSaveField }: Props) {
  const { t } = useTranslation('npcs');
  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <InlineRichField
        label={t('section_appearance')}
        value={npc.appearance}
        onSave={(html) => onSaveField('appearance', html)}
        placeholder={t('placeholder_appearance')}
        readOnly={!isGm}
      />
    </div>
  );
}

export function NpcGmNotesPanel({ npc, isGm, onSaveField }: Props) {
  const { t } = useTranslation('npcs');
  if (!isGm) return null;
  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <InlineRichField
        label={t('section_gm_notes')}
        value={npc.gmNotes}
        onSave={(html) => onSaveField('gmNotes', html)}
        isGmNotes
      />
    </div>
  );
}
