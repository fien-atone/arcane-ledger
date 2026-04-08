/**
 * GroupTypeDetailSection — right column when an existing group type is
 * selected.
 *
 * Renders the read-only header (icon + name) and the inline-editable
 * description. Name/icon editing is handled via the drawer opened through
 * the onEdit callback. Delete uses an inline yes/no confirm and reports
 * successful deletion via onDeleted so the page can clear selection.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineRichField } from '@/shared/ui';
import { useSaveGroupType, useDeleteGroupType } from '@/features/groupTypes/api';
import type { GroupTypeEntry } from '@/entities/groupType';

interface Props {
  campaignId: string;
  entry: GroupTypeEntry;
  onEdit: () => void;
  onDeleted: () => void;
}

export function GroupTypeDetailSection({ campaignId, entry, onEdit, onDeleted }: Props) {
  const { t } = useTranslation('groups');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useSaveGroupType(campaignId);
  const deleteType = useDeleteGroupType();

  const saveDescription = useCallback(
    (html: string) => {
      save.mutate({ ...entry, description: html || undefined });
    },
    [entry, save],
  );

  const handleDelete = () => {
    deleteType.mutate(entry.id, { onSuccess: () => onDeleted() });
    setConfirmDelete(false);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="px-8 md:px-12 py-8 flex flex-col gap-8">
        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
              <span className="text-[10px] text-on-surface-variant">{t('types_delete_confirm')}</span>
              <button
                onClick={handleDelete}
                className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
              >
                {t('confirm_yes')}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {t('confirm_no')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          )}
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            {t('types_edit')}
          </button>
        </div>

        {/* Name + icon badge */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/20 flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]">
              {entry.icon}
            </span>
          </div>
          <div>
            <h2 className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              {entry.name}
            </h2>
          </div>
        </div>

        {/* Description -- edit in place */}
        <InlineRichField
          label={t('types_field_description')}
          value={entry.description}
          onSave={saveDescription}
          placeholder={t('placeholder_about')}
        />
      </div>
    </div>
  );
}
