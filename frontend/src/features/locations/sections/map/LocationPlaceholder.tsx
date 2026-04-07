/**
 * LocationPlaceholder — image card with optional map-marker pin overlay.
 *
 * Moved verbatim from the legacy LocationDetailPage. Used by
 * LocationImageSection to render the location's hero image (or upload prompt
 * for the GM) and overlay child-location markers when present.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageUpload } from '@/shared/ui';
import type { MapMarker } from '@/entities/location';
import { CATEGORY_ICON_COLOR } from '@/entities/locationType';
import { CATEGORY_MARKER_CLS, MARKER_DEFAULT_CLS, type TypeMap } from './constants';

interface LocationPlaceholderProps {
  name: string;
  imageUrl?: string;
  markers?: MapMarker[];
  childLocations?: { id: string; name: string; type: string }[];
  typeMap?: TypeMap;
  onUpload?: (file: File) => void;
  onOpenMap: () => void;
}

export function LocationPlaceholder({
  name,
  imageUrl,
  markers,
  childLocations,
  typeMap,
  onUpload,
  onOpenMap,
}: LocationPlaceholderProps) {
  const { t } = useTranslation('locations');
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgBounds, setImgBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Recalculate image bounds within object-contain container
  const recalc = useCallback(() => {
    const el = containerRef.current;
    if (!el || !imageUrl) return;
    const img = el.querySelector('img[alt]') as HTMLImageElement | null;
    if (!img || !img.naturalWidth) return;
    const cW = el.offsetWidth;
    const cH = el.offsetHeight;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = cW / cH;
    let w: number, h: number;
    if (imgRatio > containerRatio) {
      w = cW;
      h = cW / imgRatio;
    } else {
      h = cH;
      w = cH * imgRatio;
    }
    setImgBounds({ left: (cW - w) / 2, top: (cH - h) / 2, width: w, height: h });
  }, [imageUrl]);

  useEffect(() => {
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [recalc]);

  const pins = (markers ?? []).map((m) => {
    const child = childLocations?.find((c) => c.id === m.linkedLocationId);
    const te = child && typeMap ? typeMap.get(child.type) : undefined;
    const icon = te?.icon ?? 'location_on';
    const iconColor = te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/60';
    const bubbleCls = te
      ? (CATEGORY_MARKER_CLS[te.category]?.bubble ?? MARKER_DEFAULT_CLS.bubble)
      : MARKER_DEFAULT_CLS.bubble;
    return { ...m, icon, iconColor, bubbleCls, label: m.label || child?.name };
  });

  return (
    <div className="relative group/loc" ref={containerRef}>
      <ImageUpload
        image={imageUrl}
        name={name}
        className="w-full aspect-[4/3]"
        onUpload={onUpload ?? (() => {})}
        onView={imageUrl ? onOpenMap : undefined}
        hideControls={!onUpload}
        uploadLabel={t('upload_map')}
        onLoad={recalc}
      />
      {/* Map markers overlay */}
      {imageUrl && pins.length > 0 && imgBounds && (
        <div
          className="absolute pointer-events-none overflow-hidden group-hover/loc:opacity-0 transition-opacity"
          style={{
            left: imgBounds.left,
            top: imgBounds.top,
            width: imgBounds.width,
            height: imgBounds.height,
          }}
        >
          {pins.map((pin) => (
            <div
              key={pin.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -14px)' }}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 ${pin.bubbleCls} shadow-[0_2px_6px_rgba(0,0,0,0.6)] flex items-center justify-center`}
              >
                <span
                  className={`material-symbols-outlined text-[10px] ${pin.iconColor}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {pin.icon}
                </span>
              </div>
              {pin.label && (
                <div className="mt-0.5 px-1 py-px rounded-sm text-[7px] font-medium text-on-surface bg-surface-container/90 border border-outline-variant/30 leading-tight whitespace-nowrap shadow-sm max-w-[80px] truncate">
                  {pin.label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
