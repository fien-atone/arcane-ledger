/**
 * MiniMapPreview — small zoomed-in preview of a marker on a parent's map.
 *
 * Moved verbatim from the legacy LocationDetailPage. Used by
 * LocationMiniMapSection to render a tiny window onto the parent location's
 * image, centered on the marker that represents this child location.
 */
import { useRef, useState } from 'react';
import type React from 'react';

const MINI_ZOOM = 2.5;

interface Props {
  imageUrl: string;
  markerX: number;
  markerY: number;
  markerLabel: string;
  markerIcon: string;
  markerIconColor: string;
  markerBubbleCls: string;
}

export function MiniMapPreview({
  imageUrl,
  markerX,
  markerY,
  markerLabel,
  markerIcon,
  markerIconColor,
  markerBubbleCls,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgStyle, setImgStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [pinPos, setPinPos] = useState<{ x: number; y: number } | null>(null);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const cW = container.offsetWidth;
    const cH = container.offsetHeight;
    const displayW = MINI_ZOOM * cW;
    const displayH = displayW * (img.naturalHeight / img.naturalWidth);

    // Clamp so image never shows dark edges
    const rawLeft = cW / 2 - (markerX / 100) * displayW;
    const rawTop  = cH / 2 - (markerY / 100) * displayH;
    const left = Math.min(0, Math.max(cW - displayW, rawLeft));
    const top  = Math.min(0, Math.max(cH - displayH, rawTop));

    // Pin pixel position = image origin + marker % * image size
    const pinX = left + (markerX / 100) * displayW;
    const pinY = top  + (markerY / 100) * displayH;

    setImgStyle({
      position: 'absolute',
      width: displayW,
      height: displayH,
      maxWidth: 'none',
      left,
      top,
      opacity: 1,
      transition: 'opacity 0.3s',
    });
    setPinPos({ x: pinX, y: pinY });
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden h-44 bg-surface-container-low">
      <img src={imageUrl} alt="" draggable={false} style={imgStyle} onLoad={handleLoad} />
      {/* Pin at computed marker position */}
      <div
        className="absolute"
        style={{
          left: pinPos?.x ?? '50%',
          top: pinPos?.y ?? '50%',
          transform: 'translate(-50%, -14px)',
          zIndex: 10,
        }}
      >
        <div className="flex flex-col items-center" style={{ userSelect: 'none' }}>
          <div
            className={`w-7 h-7 rounded-full border-2 ${markerBubbleCls} shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center`}
          >
            <span
              className={`material-symbols-outlined text-[14px] ${markerIconColor}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {markerIcon}
            </span>
          </div>
          <div className="mt-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-medium text-on-surface bg-surface-container border border-outline-variant/40 leading-tight whitespace-nowrap shadow-md">
            {markerLabel}
          </div>
          <div className="w-px h-2 bg-outline-variant/60" />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
