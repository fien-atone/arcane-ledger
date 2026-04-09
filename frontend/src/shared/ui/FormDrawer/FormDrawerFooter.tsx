import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface FormDrawerFooterProps {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  cancelLabel?: ReactNode;
  saveLabel?: ReactNode;
}

export function FormDrawerFooter({
  onCancel,
  onSave,
  saving = false,
  saveDisabled = false,
  cancelLabel,
  saveLabel,
}: FormDrawerFooterProps) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
      >
        {cancelLabel ?? t('cancel')}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled || saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
      >
        {saving ? (
          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
        ) : (
          <span className="material-symbols-outlined text-sm">save</span>
        )}
        {saveLabel ?? t('save')}
      </button>
    </div>
  );
}
