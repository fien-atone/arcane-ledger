/**
 * SectionPanel — the card-panel wrapper used by every detail / list section
 * across the app. Pure presentational: no hooks, no data knowledge, no imports
 * from features/.
 *
 * Two cosmetic size variants of the gold header row:
 *   - size="md" (default): text-sm tracking-[0.2em] — used by detail pages
 *   - size="sm": text-[10px] tracking-[0.18em] — used by the Profile forms
 *
 * If `title` is omitted the header row is not rendered; the panel becomes a
 * bare surface card — used by sections that supply their own header (e.g.
 * InlineRichField-based ones) or that have no header at all.
 *
 * The `action` slot is the optional trailing element in the header row
 * (e.g. an "Add" button). Escape hatch for everything else: `children`.
 * `className` is appended to the outer wrapper — meant for outer-layout
 * concerns like `mb-8`, never for replacing the panel's own visual style.
 */
import type { ReactNode } from 'react';

type SectionPanelSize = 'sm' | 'md';

interface Props {
  title?: ReactNode;
  action?: ReactNode;
  size?: SectionPanelSize;
  className?: string;
  children: ReactNode;
}

const BASE_WRAPPER = 'bg-surface-container border border-outline-variant/20 rounded-sm p-6';

const TITLE_CLS: Record<SectionPanelSize, string> = {
  md: 'text-sm font-label font-bold tracking-[0.2em] uppercase text-primary',
  sm: 'text-[10px] font-bold uppercase tracking-[0.18em] text-primary',
};

export function SectionPanel({ title, action, size = 'md', className, children }: Props) {
  const wrapperCls = className ? `${BASE_WRAPPER} ${className}` : BASE_WRAPPER;

  return (
    <div className={wrapperCls}>
      {(title || action) && (
        <div className="flex items-center gap-4 mb-4">
          {title && (
            size === 'sm' ? (
              <h3 className={TITLE_CLS.sm}>{title}</h3>
            ) : (
              <h2 className={TITLE_CLS.md}>{title}</h2>
            )
          )}
          <div className="h-px flex-1 bg-outline-variant/20" />
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
