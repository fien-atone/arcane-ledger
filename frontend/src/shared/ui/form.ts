// Shared form styling constants for label + input pairs used across drawers and forms.
// If you find yourself needing a new variant, consider first whether your use case
// is actually different enough to warrant it, or whether you should conform to these.

export const LABEL_CLS =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

export const INPUT_CLS =
  'w-full bg-surface-container-low border border-outline-variant/25 text-on-surface text-sm rounded-sm py-2.5 px-3 focus:border-primary focus:ring-0 focus:outline-none hover:border-outline-variant/50 transition-colors placeholder:text-on-surface-variant/30';

// Comma-separated array helpers for inputs that edit arrays as text fields.
export const toArray = (s: string): string[] =>
  s.split(',').map((x) => x.trim()).filter(Boolean);

export const fromArray = (a: string[] | null | undefined): string =>
  (a ?? []).join(', ');
