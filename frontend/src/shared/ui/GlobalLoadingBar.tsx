import { useEffect, useState } from 'react';
import { useLoadingStore } from '@/shared/api/loadingStore';

/**
 * Top-of-screen loading bar (like GitHub/Vercel/YouTube).
 * Shows when any GraphQL request is in-flight for >150ms.
 * Smoothly animates to ~80% during loading, then snaps to 100% and fades out.
 */
export function GlobalLoadingBar() {
  const count = useLoadingStore((s) => s.count);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (count > 0) {
      // Delay showing the bar so quick requests don't flash it
      const showTimer = setTimeout(() => {
        setVisible(true);
        setProgress(15);
        // Gradual increment toward 80%
        const interval = setInterval(() => {
          setProgress((p) => (p < 80 ? p + (80 - p) * 0.1 : p));
        }, 200);
        return () => clearInterval(interval);
      }, 150);
      return () => clearTimeout(showTimer);
    } else if (visible) {
      // Snap to 100% then fade out
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(hideTimer);
    }
  }, [count, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-0.5 pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/70 shadow-[0_0_8px_rgba(242,202,80,0.5)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />
    </div>
  );
}
