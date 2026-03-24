import { RichContent, toHtml } from './RichContent';

interface Props {
  notes?: string | null;
  /** Shown when notes is empty/null */
  fallback?: string;
  /**
   * card   — full section with decorative bg icon (default; detail pages main column)
   * sidebar — compact with gold left accent bar (narrow sidebar / right column)
   */
  variant?: 'card' | 'sidebar';
}

export function GmNotesSection({ notes, fallback = 'No GM notes yet.', variant = 'card' }: Props) {
  if (variant === 'sidebar') {
    return (
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 shadow-[4px_0_12px_rgba(242,202,80,0.15)]" />
        <div className="bg-surface-container p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock
            </span>
            <h4 className="text-[10px] font-label uppercase tracking-widest text-primary">GM Notes</h4>
          </div>
          {notes
            ? <RichContent value={notes} className="prose-p:text-on-surface-variant/90 prose-p:italic prose-p:text-sm" />
            : <p className="text-sm text-on-surface-variant/40 italic">{fallback}</p>}
        </div>
      </div>
    );
  }

  return (
    <section className="bg-surface-container-low p-8 border border-primary/20 rounded-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <span className="material-symbols-outlined text-6xl text-primary">lock</span>
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="material-symbols-outlined text-primary text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            lock
          </span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">GM Notes</h3>
        </div>
        {notes
          ? <RichContent value={notes} className="prose-p:text-on-surface-variant prose-p:italic prose-p:text-sm" />
          : <p className="text-sm text-on-surface-variant/40 italic">{fallback}</p>}
      </div>
    </section>
  );
}
