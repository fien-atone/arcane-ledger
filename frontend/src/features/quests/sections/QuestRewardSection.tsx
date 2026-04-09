/**
 * QuestRewardSection — reward rich-text field under a labeled header.
 *
 * GM gets the inline editor; players get read-only formatted content.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { Quest } from '@/entities/quest';

interface Props {
  quest: Quest;
  isGm: boolean;
  onSaveField: (field: keyof Quest, html: string) => void;
}

export function QuestRewardSection({ quest, isGm, onSaveField }: Props) {
  const { t } = useTranslation('quests');

  return (
    <SectionPanel title={t('section_reward')}>
      <InlineRichField
        label=""
        value={quest.reward}
        onSave={(html) => onSaveField('reward', html)}
        placeholder={t('placeholder_reward')}
        readOnly={!isGm}
      />
    </SectionPanel>
  );
}
