import { useToastStore, type Toast } from './toastStore';

const KIND_STYLES: Record<Toast['kind'], { bg: string; border: string; icon: string; iconColor: string }> = {
  error: {
    bg: 'bg-tertiary/10 backdrop-blur-md',
    border: 'border-tertiary/40',
    icon: 'error',
    iconColor: 'text-tertiary',
  },
  success: {
    bg: 'bg-secondary/10 backdrop-blur-md',
    border: 'border-secondary/40',
    icon: 'check_circle',
    iconColor: 'text-secondary',
  },
  info: {
    bg: 'bg-surface-container backdrop-blur-md',
    border: 'border-outline-variant/40',
    icon: 'info',
    iconColor: 'text-primary',
  },
};

/**
 * Stacked toast notifications shown bottom-right.
 * Auto-dismisses after a few seconds. Click X to dismiss manually.
 */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col-reverse gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const style = KIND_STYLES[toast.kind];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 max-w-sm pl-4 pr-3 py-3 ${style.bg} border ${style.border} rounded-sm shadow-2xl animate-in slide-in-from-right`}
          >
            <span className={`material-symbols-outlined text-[20px] ${style.iconColor} flex-shrink-0 mt-px`}>
              {style.icon}
            </span>
            <p className="flex-1 text-sm text-on-surface leading-snug">{toast.message}</p>
            <button
              onClick={() => remove(toast.id)}
              className="flex-shrink-0 text-on-surface-variant/40 hover:text-on-surface transition-colors -mr-1"
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
