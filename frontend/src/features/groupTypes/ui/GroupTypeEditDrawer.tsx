import { useEffect, useState } from 'react';
import { useSaveGroupType } from '../api';
import { IconPicker } from '@/shared/ui';
import type { GroupTypeEntry } from '@/entities/groupType';

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';


const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  groupType?: GroupTypeEntry;
}

export function GroupTypeEditDrawer({ open, onClose, campaignId, groupType }: Props) {
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
    save.mutate(record, { onSuccess: onClose });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isNew ? 'New Group Type' : 'Edit Group Type'}
            </h2>
            {!isNew && (
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                {groupType!.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Name */}
          <div>
            <label className={labelCls}>Name <span className="text-primary">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Faction"
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className={labelCls}>Icon <span className="text-primary">*</span></label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !icon.trim() || save.isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {save.isLoading ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
