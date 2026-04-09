import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveGroupType } from '../api';
import { IconPicker, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import type { GroupTypeEntry } from '@/entities/groupType';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (id: string) => void;
  campaignId: string;
  groupType?: GroupTypeEntry;
}

export function GroupTypeEditDrawer({ open, onClose, onSaved, campaignId, groupType }: Props) {
  const { t } = useTranslation('groups');
  const save = useSaveGroupType(campaignId);
  const isNew = !groupType;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(groupType?.name ?? '');
    setIcon(groupType?.icon ?? '');
    
  }, [open, groupType]);

  const handleSave = () => {
    if (!name.trim() || !icon.trim()) return;
    const record: GroupTypeEntry = {
      id: groupType?.id ?? '',
      campaignId,
      name: name.trim(),
      icon: icon.trim(),
      description: groupType?.description,
      createdAt: groupType?.createdAt ?? new Date().toISOString(),
    };
    save.mutate(record, {
      onSuccess: (savedId) => {
        onClose();
        onSaved?.(savedId);
      },
    });
  };

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isNew ? t('types_drawer_new_title') : t('types_drawer_edit_title')}
        subtitle={!isNew ? groupType!.name : undefined}
        onClose={onClose}
      />
      <FormDrawer.Body>

          {/* Name */}
          <div>
            <label className={LABEL_CLS}>{t('types_field_name')} <span className="text-primary">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Faction"
              className={INPUT_CLS}
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className={LABEL_CLS}>{t('types_field_icon')} <span className="text-primary">*</span></label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isLoading}
        saveDisabled={!name.trim() || !icon.trim()}
        cancelLabel={t('types_cancel')}
        saveLabel={isNew ? t('types_create') : t('types_save')}
      />
    </FormDrawer>
  );
}
