/**
 * InlineConfirm — renders the asking-state UI for the inline Yes/No confirm
 * pattern. Pairs with `useInlineConfirm()` (which owns state) and a bespoke
 * "idle" button per section (× icon, "Delete" text button, etc.).
 *
 * Pure presentational: three elements (label + yes button + no button), no
 * hooks beyond an internal `useTranslation('common')` for the hard-coded
 * "Yes" / "No" button labels. The caller passes the `label` ("Remove?" /
 * "Delete?") because that phrasing lives in the per-domain namespace.
 *
 * Two cosmetic variants:
 *   - variant="row" (default) — inline-in-list-item pill, text-[10px], no
 *     border, bg-error/5 background. Used by linked-entity list rows.
 *   - variant="hero" — bordered pill, text-[9px], border border-error/30,
 *     rounded-sm. Used by absolute-positioned hero toolbars and
 *     right-aligned type-detail toolbars.
 *
 * Hard cap: 80 lines. If it grows, something else is wrong.
 */
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

type InlineConfirmVariant = 'row' | 'hero';

interface Props {
  label: ReactNode;
  onYes: () => void;
  onNo: () => void;
  variant?: InlineConfirmVariant;
  yesDisabled?: boolean;
}

const WRAPPER_CLS: Record<InlineConfirmVariant, string> = {
  row: 'flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5',
  hero: 'flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm',
};

const LABEL_CLS: Record<InlineConfirmVariant, string> = {
  row: 'text-[10px] text-on-surface-variant whitespace-nowrap',
  hero: 'text-[9px] text-on-surface-variant',
};

const BTN_BASE = 'font-label uppercase tracking-wider transition-colors disabled:opacity-40';
const YES_CLS: Record<InlineConfirmVariant, string> = {
  row: `${BTN_BASE} px-2 py-1 text-[10px] text-error hover:text-on-surface`,
  hero: `${BTN_BASE} px-1.5 py-0.5 text-[9px] text-error hover:text-on-surface`,
};
const NO_CLS: Record<InlineConfirmVariant, string> = {
  row: `${BTN_BASE} px-2 py-1 text-[10px] text-on-surface-variant hover:text-on-surface`,
  hero: `${BTN_BASE} px-1.5 py-0.5 text-[9px] text-on-surface-variant hover:text-on-surface`,
};

export function InlineConfirm({
  label,
  onYes,
  onNo,
  variant = 'row',
  yesDisabled = false,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <div className={WRAPPER_CLS[variant]}>
      <span className={LABEL_CLS[variant]}>{label}</span>
      <button type="button" onClick={onYes} disabled={yesDisabled} className={YES_CLS[variant]}>
        {t('yes')}
      </button>
      <button type="button" onClick={onNo} className={NO_CLS[variant]}>
        {t('no')}
      </button>
    </div>
  );
}
