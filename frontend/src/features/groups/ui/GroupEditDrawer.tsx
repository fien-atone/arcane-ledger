import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveGroup } from '@/features/groups/api';
import { useGroupTypes } from '@/features/groupTypes';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { Group } from '@/entities/group';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  group?: Group;
}

function toArray(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
function fromArray(arr: string[]): string {
  return arr.join(', ');
}

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {isEdit ? t('drawer_edit_title') : t('drawer_new_title')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <label className={labelCls}>{t('field_name')} <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholder_name')} className={inputCls} autoFocus />
          </div>

          {typesEnabled && (
            <div>
              <label className={labelCls}>{t('field_type')}</label>
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
            <label className={labelCls}>{t('field_aliases')} <span className="text-on-surface-variant/30 normal-case tracking-normal">{t('field_aliases_hint')}</span></label>
            <input type="text" value={aliases} onChange={(e) => setAliases(e.target.value)}
              placeholder={t('placeholder_aliases')} className={inputCls} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:border-primary/50 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave} disabled={!name.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            {isEdit ? t('save') : t('create')}
          </button>
        </div>
      </div>
    </>
  );
}
