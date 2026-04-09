import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveQuest } from '@/features/quests/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { Quest } from '@/entities/quest';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  quest?: Quest;
}

export function QuestEditDrawer({ open, onClose, campaignId, quest }: Props) {
  const { t } = useTranslation('quests');
  const save = useSaveQuest(campaignId);
  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const { data: allNpcs } = useNpcs(campaignId);
  const isEdit = !!quest;

  const [title, setTitle] = useState('');
  const [giverId, setGiverId] = useState('');

  useEffect(() => {
    if (!open) return;
    if (quest) {
      setTitle(quest.title);
      setGiverId(quest.giverId ?? '');
    } else {
      setTitle('');
      setGiverId('');
    }
  }, [open, quest]);

  const npcOptions: SelectOption<string>[] = (allNpcs ?? [])
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => ({ value: n.id, label: n.name }));

  const handleSave = () => {
    if (!title.trim()) return;
    const record: Quest = {
      id: quest?.id ?? '',
      campaignId,
      title: title.trim(),
      description: quest?.description ?? '',
      giverId: giverId || undefined,
      reward: quest?.reward,
      status: quest?.status ?? 'undiscovered',
      notes: quest?.notes ?? '',
      createdAt: quest?.createdAt ?? new Date().toISOString(),
    };
    save.mutate(record, { onSuccess: onClose });
  };

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isEdit ? t('drawer_edit_title') : t('drawer_new_title')}
        onClose={onClose}
      />
      <FormDrawer.Body>
          <div>
            <label className={LABEL_CLS}>{t('field_title')} <span className="text-primary">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('placeholder_title')}
              className={INPUT_CLS}
              autoFocus
            />
          </div>

          {npcsEnabled && (
          <div>
            <label className={LABEL_CLS}>{t('field_quest_giver')}</label>
            <Select<string>
              value={giverId}
              options={npcOptions}
              onChange={(v) => setGiverId(v || '')}
              placeholder={t('placeholder_quest_giver')}
              nullable
              searchable
            />
          </div>
          )}

      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!title.trim()}
        cancelLabel={t('cancel')}
        saveLabel={isEdit ? t('save') : t('create')}
      />
    </FormDrawer>
  );
}
