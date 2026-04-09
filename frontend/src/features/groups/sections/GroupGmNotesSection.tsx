/**
 * GroupGmNotesSection — private GM-only notes panel for a group.
 *
 * Returns null for non-GM viewers (mirrors NpcGmNotesPanel /
 * SessionGmNotesSection patterns).
 */
import { useTranslation } from 'react-i18next';
import { InlineRichField, SectionPanel } from '@/shared/ui';
import type { Group } from '@/entities/group';

interface Props {
  group: Group;
  isGm: boolean;
  onSaveField: (field: keyof Group, html: string) => void;
}

export function GroupGmNotesSection({ group, isGm, onSaveField }: Props) {
  const { t } = useTranslation('groups');
  if (!isGm) return null;

  return (
    <SectionPanel>
      <InlineRichField
        label={t('section_gm_notes')}
        value={group.gmNotes}
        onSave={(html) => onSaveField('gmNotes', html)}
        isGmNotes
      />
    </SectionPanel>
  );
}
