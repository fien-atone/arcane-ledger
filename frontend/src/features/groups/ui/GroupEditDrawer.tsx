import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveGroup } from '@/features/groups/api';
import { useGroupTypes } from '@/features/groupTypes';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select, LABEL_CLS, INPUT_CLS, toArray, fromArray, FormDrawer } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { Group } from '@/entities/group';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  group?: Group;
}

export function GroupEditDrawer({ open, onClose, campaignId, group }: Props) {
  const { t } = useTranslation('groups');
  const save = useSaveGroup();
  const typesEnabled = useSectionEnabled(campaignId, 'group_types');
  const { data: groupTypes } = useGroupTypes(campaignId);
  const isEdit = !!group;

  const [name, setName] = useState('');
  const [type, setType] = useState<string>('');
  const [aliases, setAliases] = useState('');

  const typeOptions = useMemo<SelectOption<string>[]>(
    () => (groupTypes ?? []).map((t) => ({ value: t.id, label: t.name, icon: t.icon })),
    [groupTypes],
  );

  useEffect(() => {
    if (!open) return;
    if (group) {
      setName(group.name);
      setType(group.type);
      setAliases(fromArray(group.aliases));
    } else {
      setName('');
      setType('');
      setAliases('');
    }
  }, [open, group]);

  const handleSave = () => {
    if (!name.trim()) return;
    const ts = new Date().toISOString();
    const record: Group = {
      id: group?.id ?? '',
      campaignId,
      name: name.trim(),
      type: typesEnabled ? type : (group?.type ?? ''),  // empty string becomes null on backend
      aliases: toArray(aliases),
      description: group?.description ?? '',
      goals: group?.goals,
      symbols: group?.symbols,
      gmNotes: group?.gmNotes,
      createdAt: group?.createdAt ?? ts,
      updatedAt: ts,
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
            <label className={LABEL_CLS}>{t('field_name')} <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholder_name')} className={INPUT_CLS} autoFocus />
          </div>

          {typesEnabled && (
            <div>
              <label className={LABEL_CLS}>{t('field_type')}</label>
              <Select<string>
                value={type}
                options={typeOptions}
                onChange={(v) => setType(v || '')}
                nullable
                placeholder={t('placeholder_type_none')}
                searchable
              />
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>{t('field_aliases')} <span className="text-on-surface-variant/30 normal-case tracking-normal">{t('field_aliases_hint')}</span></label>
            <input type="text" value={aliases} onChange={(e) => setAliases(e.target.value)}
              placeholder={t('placeholder_aliases')} className={INPUT_CLS} />
          </div>
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!name.trim()}
        cancelLabel={t('cancel')}
        saveLabel={isEdit ? t('save') : t('create')}
      />
    </FormDrawer>
  );
}
