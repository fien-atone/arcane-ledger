/**
 * QuestGmNotesSection — private GM-only notes panel for a quest.
 *
 * Returns null for non-GM viewers (mirrors GroupGmNotesSection /
 * CharacterGmNotesSection patterns).
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
import type { Quest } from '@/entities/quest';

interface Props {
  quest: Quest;
  isGm: boolean;
  onSaveField: (field: keyof Quest, html: string) => void;
}

export function QuestGmNotesSection({ quest, isGm, onSaveField }: Props) {
  const { t } = useTranslation('quests');
  if (!isGm) return null;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <InlineRichField
        label={t('section_gm_notes')}
        value={quest.notes}
        onSave={(html) => onSaveField('notes', html)}
        isGmNotes
      />
    </div>
  );
}
