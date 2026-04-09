import type { ReactNode } from 'react';

interface FormDrawerHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
}

export function FormDrawerHeader({ title, subtitle, onClose }: FormDrawerHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
      <div>
        <h2 className="font-headline text-xl font-bold text-on-surface">{title}</h2>
        {subtitle && (
          <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
        aria-label="Close"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
