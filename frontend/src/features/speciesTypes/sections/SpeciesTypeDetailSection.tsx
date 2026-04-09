/**
 * SpeciesTypeDetailSection — right column when an existing species type is
 * selected.
 *
 * Renders the read-only header (icon + name) and the inline-editable
 * description. Name/icon editing is handled via the drawer opened through
 * the onEdit callback. Delete uses an inline yes/no confirm.
 */
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { InlineRichField, InlineConfirm, useInlineConfirm } from '@/shared/ui';
import { useSaveSpeciesType, useDeleteSpeciesType } from '@/features/speciesTypes/api';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

interface Props {
  campaignId: string;
  entry: SpeciesTypeEntry;
  onEdit: () => void;
  onDeleted: () => void;
}

export function SpeciesTypeDetailSection({ campaignId, entry, onEdit, onDeleted }: Props) {
  const { t } = useTranslation('species');
  const confirmDelete = useInlineConfirm<string>();
  const save = useSaveSpeciesType(campaignId);
  const deleteType = useDeleteSpeciesType();

  const saveDescription = useCallback(
    (html: string) => {
      save.mutate({ ...entry, description: html || undefined });
    },
    [entry, save],
  );

  const handleDelete = () => {
    deleteType.mutate(entry.id, { onSuccess: () => onDeleted() });
    confirmDelete.cancel();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-end gap-2 px-6 py-3.5 border-b border-outline-variant/10">
        {confirmDelete.isAsking(entry.id) ? (
          <InlineConfirm
            variant="hero"
            label={t('types_delete_confirm')}
            onYes={handleDelete}
            onNo={confirmDelete.cancel}
          />
        ) : (
          <button
            onClick={() => confirmDelete.ask(entry.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-rose-400 text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-rose-500/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[13px]">delete</span>
            {t('types_delete')}
          </button>
        )}
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
        >
          <span className="material-symbols-outlined text-[13px]">edit</span>
          {t('types_edit')}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-sm flex items-center justify-center bg-primary/10 border border-primary/20">
            <span className="material-symbols-outlined text-primary text-[28px]">{entry.icon}</span>
          </div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">{entry.name}</h2>
        </div>

        <InlineRichField
          label={t('types_field_description')}
          value={entry.description}
          onSave={saveDescription}
          placeholder={t('placeholder_overview')}
        />
      </div>
    </div>
  );
}
