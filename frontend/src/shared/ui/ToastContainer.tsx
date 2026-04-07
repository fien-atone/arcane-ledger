import { useToastStore, type Toast } from './toastStore';

const KIND_STYLES: Record<Toast['kind'], { border: string; icon: string; iconColor: string; textColor: string }> = {
  error: {
    border: 'border-tertiary/40',
    icon: 'error',
    iconColor: 'text-tertiary',
    textColor: 'text-tertiary',
  },
  success: {
    border: 'border-secondary/40',
    icon: 'check_circle',
    iconColor: 'text-secondary',
    textColor: 'text-secondary',
  },
  info: {
    border: 'border-primary/40',
    icon: 'info',
    iconColor: 'text-primary',
    textColor: 'text-on-surface',
  },
};

/**
 * Stacked toast notifications shown bottom-center.
 * Matches the design system: bg-surface-container with subtle accent border,
 * uppercase font-label text. Auto-dismisses after a few seconds.
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const style = KIND_STYLES[toast.kind];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 max-w-md pl-4 pr-2 py-2.5 bg-surface-container border ${style.border} rounded-sm shadow-2xl`}
          >
            <span className={`material-symbols-outlined text-[18px] ${style.iconColor} flex-shrink-0`}>
              {style.icon}
            </span>
            <p className={`flex-1 text-xs font-label uppercase tracking-widest ${style.textColor}`}>
              {toast.message}
            </p>
            <button
              onClick={() => remove(toast.id)}
              className="flex-shrink-0 p-1 text-on-surface-variant/40 hover:text-on-surface transition-colors"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
