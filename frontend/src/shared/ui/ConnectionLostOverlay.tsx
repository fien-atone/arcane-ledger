import { useConnectionStore } from '@/shared/api/connectionStatus';

export function ConnectionLostOverlay() {
  const backendDown = useConnectionStore((s) => s.backendDown);

  if (!backendDown) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm shadow-2xl max-w-md w-full mx-6 p-8 text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-error/10 border border-error/20 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[40px] text-error/60">error</span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="font-headline text-xl font-bold text-on-surface">Something went wrong</h2>
          <p className="text-sm text-on-surface-variant/60 leading-relaxed">
            An error occurred while communicating with the server. Please try again later or contact your administrator.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-label uppercase tracking-widest text-primary border border-primary/30 rounded-sm hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">refresh</span>
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
