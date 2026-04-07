/**
 * GroupGoalsSection — public-facing goals/agenda for a group.
 *
 * GM gets the inline rich-text editor; players get read-only formatted content.
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
import type { Group } from '@/entities/group';

interface Props {
  group: Group;
  isGm: boolean;
  onSaveField: (field: keyof Group, html: string) => void;
}

export function GroupGoalsSection({ group, isGm, onSaveField }: Props) {
  const { t } = useTranslation('groups');

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <InlineRichField
        label={t('section_goals')}
        value={group.goals}
        onSave={(html) => onSaveField('goals', html)}
        placeholder={t('placeholder_goals')}
        readOnly={!isGm}
      />
    </div>
  );
}
