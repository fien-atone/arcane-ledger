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
import { IconPicker, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import { useSaveSpeciesType } from '@/features/speciesTypes/api';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

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
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isNew ? t('types_drawer_new_title') : t('types_drawer_edit_title')}
        onClose={onClose}
      />
      <FormDrawer.Body>
          <div>
            <label className={LABEL_CLS}>
              {t('types_field_name')} <span className="text-primary">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Humanoid"
              className={INPUT_CLS}
              autoFocus
            />
          </div>
          <div>
            <label className={LABEL_CLS}>{t('types_field_icon')}</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!name.trim()}
        cancelLabel={t('types_cancel')}
        saveLabel={isNew ? t('types_create') : t('types_save')}
      />
    </FormDrawer>
  );
}
