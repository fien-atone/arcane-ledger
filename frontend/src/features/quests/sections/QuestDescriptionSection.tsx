/**
 * QuestDescriptionSection — public-facing description for a quest.
 *
 * GM gets the inline rich-text editor; players get read-only formatted content.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
import type { Quest } from '@/entities/quest';

interface Props {
  quest: Quest;
  isGm: boolean;
  onSaveField: (field: keyof Quest, html: string) => void;
}

export function QuestDescriptionSection({ quest, isGm, onSaveField }: Props) {
  const { t } = useTranslation('quests');

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <InlineRichField
        label={t('section_description')}
        value={quest.description}
        onSave={(html) => onSaveField('description', html)}
        placeholder={t('placeholder_description')}
        readOnly={!isGm}
      />
    </div>
  );
}
