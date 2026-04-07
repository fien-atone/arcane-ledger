import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingStore } from '@/shared/api/loadingStore';

/**
 * Compact loading indicator pinned to the top-center of the screen.
 * Appears when any GraphQL request is in-flight for >200ms (avoids flashing
 * on fast requests). Sits next to where the campaign name pill lives.
 */
export function GlobalLoadingBar() {
  const count = useLoadingStore((s) => s.count);
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (count > 0) {
      // Delay showing so quick requests don't flash
      const showTimer = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(showTimer);
    } else if (visible) {
      // Brief delay before hiding to avoid flicker between back-to-back requests
      const hideTimer = setTimeout(() => setVisible(false), 150);
      return () => clearTimeout(hideTimer);
    }
  }, [count, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-container/95 backdrop-blur-md border border-primary/30 rounded-full shadow-lg shadow-primary/10">
        <span className="material-symbols-outlined text-[14px] text-primary animate-spin">
          progress_activity
        </span>
        <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
          {t('loading')}
        </span>
      </div>
    </div>
  );
}
