/**
 * SpeciesTypeDrawer — form drawer for creating or editing a species type.
 *
 * Used by SpeciesTypesPage for both the "add new" flow and the "edit" flow
 * on an existing entry. Owns its own local form state and save mutation.
 * Reports the saved entry id back via onSaved so the page can auto-select
 * the newly created type (see useSpeciesTypesPage.finishCreate).
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconPicker } from '@/shared/ui';
import { useSaveSpeciesType } from '@/features/speciesTypes/api';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (id: string) => void;
  campaignId: string;
  entry?: SpeciesTypeEntry;
}

export function SpeciesTypeDrawer({ open, onClose, onSaved, campaignId, entry }: Props) {
  const { t } = useTranslation('species');
  const save = useSaveSpeciesType(campaignId);
  const isNew = !entry;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  // Reset form when opened
  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (entry) {
        setName(entry.name);
        setIcon(entry.icon);
      } else {
        setName('');
        setIcon('');
      }
    }
  }

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    save.mutate(
      {
        id: entry?.id ?? '',
        campaignId,
        name: name.trim(),
        icon,
        createdAt: entry?.createdAt ?? '',
      },
      {
        onSuccess: (savedId: string) => {
          onClose();
          onSaved?.(savedId);
        },
      },
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <h2 className="text-lg font-headline font-bold text-on-surface">
            {isNew ? t('types_drawer_new_title') : t('types_drawer_edit_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <label className={labelCls}>
              {t('types_field_name')} <span className="text-primary">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Humanoid"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>{t('types_field_icon')}</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:border-primary/50 transition-colors"
          >
            {t('types_cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isNew ? t('types_create') : t('types_save')}
          </button>
        </div>
      </div>
    </>
  );
}
