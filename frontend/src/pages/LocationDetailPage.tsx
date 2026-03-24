import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocation, useLocations, useSaveLocation } from '@/features/locations/api';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useNpcs, useSaveNpc } from '@/features/npcs/api/queries';
import { useSessions } from '@/features/sessions/api';
import { useLocationTypes } from '@/features/locationTypes';
import { InlineRichField } from '@/shared/ui';
import type { Location, MapMarker } from '@/entities/location';
import type { LocationTypeEntry } from '@/entities/locationType';
import { CATEGORY_ICON_COLOR, CATEGORY_BADGE_CLS, CATEGORY_TILE_CLS, CATEGORY_LABEL } from '@/entities/locationType';
import type { NPC } from '@/entities/npc';

type TypeMap = Map<string, LocationTypeEntry>;

// ─────────────────────────────────────────────────────────────────────────────
// LocationPlaceholder
// ─────────────────────────────────────────────────────────────────────────────

interface LocationPlaceholderProps {
  name: string;
  imageUrl?: string;
  onUpload: (dataUrl: string) => void;
  onOpenMap: () => void;
}

function LocationPlaceholder({ name, imageUrl, onUpload, onOpenMap }: LocationPlaceholderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUpload(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="relative group w-full">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
      <div className="relative w-full h-80 overflow-hidden rounded-sm bg-surface-container-low flex items-center justify-center">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
            {/* Open Map overlay */}
            <button
              type="button"
              onClick={onOpenMap}
              className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
              title="Open Map"
            >
              <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">map</span>
              <span className="text-white text-xs font-label uppercase tracking-widest mt-1 drop-shadow">Open Map</span>
            </button>
            {/* Re-upload button (bottom-right, does NOT open map) */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-full p-1.5"
              title="Replace image"
            >
              <span className="material-symbols-outlined text-white text-base">photo_camera</span>
            </button>
          </>
        ) : (
          <>
            <span className="font-headline text-[8rem] font-bold text-on-surface-variant/10 select-none leading-none">
              {initials}
            </span>
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
              title="Upload Map"
            >
              <span className="material-symbols-outlined text-white text-4xl drop-shadow-lg">photo_camera</span>
              <span className="text-white text-xs font-label uppercase tracking-widest mt-1 drop-shadow">Upload Map</span>
            </button>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MiniMapPreview
// ─────────────────────────────────────────────────────────────────────────────

const MINI_ZOOM = 2.5;

function MiniMapPreview({
  imageUrl,
  markerX,
  markerY,
  markerLabel,
  markerIcon,
  markerIconColor,
  markerBubbleCls,
}: {
  imageUrl: string;
  markerX: number;
  markerY: number;
  markerLabel: string;
  markerIcon: string;
  markerIconColor: string;
  markerBubbleCls: string;
}) {
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

    setImgStyle({ position: 'absolute', width: displayW, height: displayH, maxWidth: 'none', left, top, opacity: 1, transition: 'opacity 0.3s' });
    setPinPos({ x: pinX, y: pinY });
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden h-44 bg-surface-container-low">
      <img src={imageUrl} alt="" draggable={false} style={imgStyle} onLoad={handleLoad} />
      {/* Pin at computed marker position */}
      <div className="absolute" style={{ left: pinPos?.x ?? '50%', top: pinPos?.y ?? '50%', transform: 'translate(-50%, -14px)', zIndex: 10 }}>
        <div className="flex flex-col items-center" style={{ userSelect: 'none' }}>
          <div className={`w-7 h-7 rounded-full border-2 ${markerBubbleCls} shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center`}>
            <span className={`material-symbols-outlined text-[14px] ${markerIconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{markerIcon}</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// MapViewer
// ─────────────────────────────────────────────────────────────────────────────

interface MapViewerProps {
  imageUrl: string;
  locationId: string;
  locationName: string;
  initialMarkers: MapMarker[];
  childLocations: Location[];
  npcsHere: NPC[];
  campaignId: string;
  typeMap: TypeMap;
  onClose: () => void;
  onSave: (markers: MapMarker[]) => void;
  onRequestAddLocation: (point: { x: number; y: number }) => void;
  externalMarkerToAdd?: MapMarker | null;
  onExternalMarkerAdded?: () => void;
}

const CATEGORY_MARKER_CLS: Record<string, { bubble: string; icon: string }> = {
  world:        { bubble: 'bg-indigo-950/80 border-indigo-400',  icon: 'text-indigo-300' },
  civilization: { bubble: 'bg-amber-950/80 border-amber-400',    icon: 'text-amber-300' },
  geographic:   { bubble: 'bg-emerald-950/80 border-emerald-400', icon: 'text-emerald-300' },
  water:        { bubble: 'bg-sky-950/80 border-sky-400',        icon: 'text-sky-300' },
  poi:          { bubble: 'bg-rose-950/80 border-rose-400',      icon: 'text-rose-300' },
  travel:       { bubble: 'bg-violet-950/80 border-violet-400',  icon: 'text-violet-300' },
};
const MARKER_DEFAULT_CLS = { bubble: 'bg-surface-container border-primary', icon: 'text-primary' };

function MapViewer({
  imageUrl,
  locationId: _locationId,
  locationName,
  initialMarkers,
  childLocations,
  npcsHere,
  campaignId,
  typeMap,
  onClose,
  onSave,
  onRequestAddLocation,
  externalMarkerToAdd,
  onExternalMarkerAdded,
}: MapViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
  const markersRef = useRef(markers);
  useEffect(() => { markersRef.current = markers; }, [markers]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [panning, setPanning] = useState<{
    startMx: number;
    startMy: number;
    startTx: number;
    startTy: number;
  } | null>(null);
  const hasMovedRef = useRef(false);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [addLocMode, setAddLocMode] = useState(false);

  // Escape cancels add mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddLocMode(false);
        setGhostPos(null);
        setSelectedMarkerId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Keep refs for use inside event listeners without stale closures
  const scaleRef = useRef(scale);
  const translateRef = useRef(translate);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { translateRef.current = translate; }, [translate]);

  // Wheel zoom via addEventListener (passive: false required to preventDefault)
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const currentScale = scaleRef.current;
      const currentTranslate = translateRef.current;
      const newScale = Math.max(0.1, Math.min(10, currentScale * factor));
      const newTx = cx - (cx - currentTranslate.x) * (newScale / currentScale);
      const newTy = cy - (cy - currentTranslate.y) * (newScale / currentScale);
      setScale(newScale);
      setTranslate({ x: newTx, y: newTy });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  const handleImageLoad = useCallback(() => {
    const img = imageRef.current;
    const vp = viewportRef.current;
    if (!img || !vp) return;
    const s = Math.min(vp.offsetWidth / img.naturalWidth, vp.offsetHeight / img.naturalHeight);
    setScale(s);
    setTranslate({
      x: (vp.offsetWidth - img.naturalWidth * s) / 2,
      y: (vp.offsetHeight - img.naturalHeight * s) / 2,
    });
  }, []);

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const imgX = (clientX - rect.left) / scale;
      const imgY = (clientY - rect.top) / scale;
      const pctX = Math.max(0, Math.min(100, (imgX / container.offsetWidth) * 100));
      const pctY = Math.max(0, Math.min(100, (imgY / container.offsetHeight) * 100));
      return { x: pctX, y: pctY };
    },
    [scale],
  );

  const getMarkerViewportPos = useCallback((marker: MapMarker) => {
    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return { x: 0, y: 0 };
    const containerRect = container.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    return {
      x: containerRect.left - viewportRect.left + (marker.x / 100) * containerRect.width,
      y: containerRect.top - viewportRect.top + (marker.y / 100) * containerRect.height,
    };
  }, []);

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  const onViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-marker]') || target.closest('[data-popup]')) return;
    hasMovedRef.current = false;
    setPanning({
      startMx: e.clientX,
      startMy: e.clientY,
      startTx: translate.x,
      startTy: translate.y,
    });
  };

  const onViewportMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panning) {
      const dx = e.clientX - panning.startMx;
      const dy = e.clientY - panning.startMy;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      setTranslate({ x: panning.startTx + dx, y: panning.startTy + dy });
    }
    if (dragging) {
      hasMovedRef.current = true;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const pinScreenX = e.clientX - dragging.offsetX;
      const pinScreenY = e.clientY - dragging.offsetY;
      const imgX = (pinScreenX - rect.left) / scale;
      const imgY = (pinScreenY - rect.top) / scale;
      const pctX = Math.max(0, Math.min(100, (imgX / container.offsetWidth) * 100));
      const pctY = Math.max(0, Math.min(100, (imgY / container.offsetHeight) * 100));
      setMarkers((prev) =>
        prev.map((m) => (m.id === dragging.id ? { ...m, x: pctX, y: pctY } : m)),
      );
    }
    if (addLocMode) {
      setGhostPos(toImageCoords(e.clientX, e.clientY));
    } else if (ghostPos) {
      setGhostPos(null);
    }
  };

  const onViewportMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const didMove = hasMovedRef.current;
    setPanning(null);
    setDragging(null);

    const target = e.target as HTMLElement;
    if (target.closest('[data-marker]') || target.closest('[data-popup]')) return;

    if (selectedMarkerId) {
      setSelectedMarkerId(null);
      return;
    }
    if (addLocMode && !didMove) {
      const coords = toImageCoords(e.clientX, e.clientY);
      setAddLocMode(false);
      onRequestAddLocation(coords);
    }
  };

  const onViewportMouseLeave = () => {
    setPanning(null);
    setDragging(null);
    setGhostPos(null);
  };

  const onMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    const marker = markers.find((m) => m.id === markerId);
    const container = containerRef.current;
    if (!marker || !container) return;
    const rect = container.getBoundingClientRect();
    const pinScreenX = rect.left + (marker.x / 100) * rect.width;
    const pinScreenY = rect.top + (marker.y / 100) * rect.height;
    setDragging({ id: markerId, offsetX: e.clientX - pinScreenX, offsetY: e.clientY - pinScreenY });
    hasMovedRef.current = false;
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  // Accept externally-created marker (from page-level LocationEditDrawer)
  useEffect(() => {
    if (!externalMarkerToAdd) return;
    const updated = [...markersRef.current, externalMarkerToAdd];
    setMarkers(updated);
    onSave(updated);
    onExternalMarkerAdded?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMarkerToAdd]);

  const cursorStyle =
    panning ? 'grabbing' : addLocMode ? 'crosshair' : 'grab';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface-container-low border-b border-outline-variant/20 px-6 py-3 flex justify-between items-center">
        {/* Left */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-lg">map</span>
          <span className="font-headline text-on-surface text-base font-bold">{locationName}</span>
          {markers.length > 0 && (
            <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest">
              {markers.length} marker{markers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setAddLocMode((v) => !v); setGhostPos(null); setSelectedMarkerId(null); }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm border border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_location_alt</span>
            Add Location
          </button>
          <button
            onClick={() => { onSave(markers); onClose(); }}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      {/* Body: map viewport + marker list sidebar */}
      <div className="flex-1 flex overflow-hidden">

      {/* Map viewport */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden relative"
        style={{ cursor: cursorStyle }}
        onMouseDown={onViewportMouseDown}
        onMouseMove={onViewportMouseMove}
        onMouseUp={onViewportMouseUp}
        onMouseLeave={onViewportMouseLeave}
      >
        {/* Transformed container (image + markers) */}
        <div
          ref={containerRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: 'top left',
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            userSelect: 'none',
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt={locationName}
            draggable={false}
            style={{ display: 'block', maxWidth: 'none' }}
            onLoad={handleImageLoad}
          />

          {/* Marker pins */}
          {markers.map((m) => (
            <div
              key={m.id}
              data-marker="true"
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                transform: 'translate(-50%, -14px)',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onMouseDown={(e) => onMarkerMouseDown(e, m.id)}
              onMouseEnter={() => setHoveredMarkerId(m.id)}
              onMouseLeave={() => setHoveredMarkerId(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasMovedRef.current) {
                  setSelectedMarkerId((prev) => (prev === m.id ? null : m.id));
                }
              }}
            >
              {(() => {
                const linkedType = childLocations.find((l) => l.id === m.linkedLocationId)?.type ?? '';
                const te = typeMap.get(linkedType);
                const cls = te ? (CATEGORY_MARKER_CLS[te.category] ?? MARKER_DEFAULT_CLS) : MARKER_DEFAULT_CLS;
                return (
                <div className="flex flex-col items-center" style={{ userSelect: 'none' }}>
                {/* Icon bubble */}
                <div
                  className={`w-7 h-7 rounded-full border-2 ${cls.bubble} flex items-center justify-center text-[11px] font-bold leading-none transition-all duration-150 ${
                    selectedMarkerId === m.id
                      ? 'shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_16px_6px_rgba(var(--color-primary)/0.7)] ring-2 ring-primary ring-offset-2 ring-offset-black/50 scale-130'
                      : hoveredMarkerId === m.id
                      ? 'shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_22px_8px_rgba(255,255,255,0.5)] scale-130 brightness-150 ring-1 ring-white/40'
                      : 'shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[14px] ${cls.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {te?.icon ?? 'place'}
                  </span>
                </div>
                {/* Label */}
                <div className="mt-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-medium text-on-surface bg-surface-container border border-outline-variant/40 leading-tight whitespace-nowrap max-w-[128px] truncate shadow-md">
                  {m.label}
                </div>
                {/* Pin tail */}
                <div className="w-px h-2 bg-outline-variant/60" />
              </div>
                );
              })()}
            </div>
          ))}
        </div>

        {/* Ghost cursor in add mode */}
        {addLocMode && ghostPos && (() => {
          const pos = getMarkerViewportPos(ghostPos as MapMarker);
          return (
            <div
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -14px)',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              <div className="w-7 h-7 rounded-full border-2 border-primary/70 bg-surface-container/60 flex items-center justify-center animate-pulse backdrop-blur-sm">
                <span className="material-symbols-outlined text-[14px] text-primary/80">add_location_alt</span>
              </div>
            </div>
          );
        })()}

        {/* Add mode instruction banner */}
        {addLocMode && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container/90 backdrop-blur-sm border border-primary/30 rounded-sm shadow-lg">
              <span className="material-symbols-outlined text-[14px] text-primary animate-pulse">add_location_alt</span>
              <span className="text-[10px] font-label uppercase tracking-widest text-primary">Click on map to place a new location</span>
              <span className="text-[10px] text-on-surface-variant/40 ml-1">Esc to cancel</span>
            </div>
          </div>
        )}

        {/* Selected marker popup */}
        {selectedMarker &&
          (() => {
            const pos = getMarkerViewportPos(selectedMarker);
            const linkedLocation = childLocations.find((l) => l.id === selectedMarker.linkedLocationId);
            const linkedNpc = npcsHere.find((n) => n.id === selectedMarker.linkedNpcId);
            return (
              <div
                data-popup="true"
                style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, calc(-100% - 14px))', zIndex: 50 }}
                className="bg-surface-container border border-outline-variant/30 rounded-sm shadow-xl p-3 w-48 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-2">
                  {linkedLocation ? (
                    <Link
                      to={`/campaigns/${campaignId}/locations/${linkedLocation.id}`}
                      onClick={onClose}
                      className="text-sm font-headline font-bold text-primary hover:text-primary/80 truncate flex-1"
                    >
                      {linkedLocation.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-headline font-bold text-on-surface flex-1 truncate">{selectedMarker.label}</span>
                  )}
                  <button
                    onClick={() => setSelectedMarkerId(null)}
                    className="ml-2 flex-shrink-0 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                {linkedNpc && (
                  <Link
                    to={`/campaigns/${campaignId}/npcs/${linkedNpc.id}`}
                    onClick={onClose}
                    className="block text-[11px] text-emerald-400 hover:text-emerald-300 mb-1 truncate"
                  >
                    → {linkedNpc.name}
                  </Link>
                )}
                <button
                  onClick={() => {
                    const updated = markers.filter((m) => m.id !== selectedMarkerId);
                    setMarkers(updated);
                    onSave(updated);
                    setSelectedMarkerId(null);
                  }}
                  className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 mt-1"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                  Delete marker
                </button>
              </div>
            );
          })()}


        {/* Zoom hint */}
        <div className="absolute bottom-4 left-4 text-[10px] text-white/30 pointer-events-none select-none">
          Scroll to zoom · Drag to pan{addLocMode ? ' · Click to place' : ''} · {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Marker list sidebar */}
      <div className="w-56 flex-shrink-0 bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex-shrink-0">
          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/50 font-label flex items-center justify-between">
            <span>Locations</span>
            {childLocations.length > 0 && (
              <span>
                <span className="text-on-surface-variant/50">{markers.filter(m => m.linkedLocationId).length} of </span>
                <span className="text-primary font-bold">{childLocations.length}</span>
              </span>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
          {(() => {
            const markerByLocId = new Map(
              markers.filter((m) => m.linkedLocationId).map((m) => [m.linkedLocationId!, m])
            );
            const unlinkedMarkers = markers.filter((m) => !m.linkedLocationId);

            // Group child locations by category, sorted by CATEGORY_ORDER then name
            const grouped = new Map<string, Location[]>();
            const sortedLocs = [...childLocations].sort((a, b) => {
              const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
              const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
              if (catA !== catB) return catA - catB;
              return a.name.localeCompare(b.name);
            });
            for (const loc of sortedLocs) {
              const cat = typeMap.get(loc.type)?.category ?? '';
              if (!grouped.has(cat)) grouped.set(cat, []);
              grouped.get(cat)!.push(loc);
            }

            const isEmpty = childLocations.length === 0 && markers.length === 0;
            if (isEmpty) {
              return <p className="text-[10px] text-on-surface-variant/30 italic px-4 pt-4">No locations or markers yet.</p>;
            }

            return (
              <div className="py-1">
                {/* Locations grouped by category */}
                {[...grouped.entries()].map(([cat, locs], gi) => (
                  <div key={cat || gi}>
                    <div className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/30 flex items-center gap-2">
                      <span>{CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] ?? cat}</span>
                      <div className="flex-1 h-px bg-outline-variant/10" />
                    </div>
                    {locs.map((loc) => {
                      const marker = markerByLocId.get(loc.id) ?? null;
                      const te = typeMap.get(loc.type);
                      const markerId = marker?.id ?? null;
                      const isHovered = hoveredMarkerId === markerId && markerId !== null;
                      const isSelected = selectedMarkerId === markerId && markerId !== null;
                      if (!marker) {
                        return (
                          <div key={loc.id} className="px-3 py-2.5 flex items-center gap-2.5 border-l-2 border-l-transparent cursor-default">
                            <span className={`material-symbols-outlined text-[15px] flex-shrink-0 ${te ? `${CATEGORY_ICON_COLOR[te.category]} opacity-30` : 'text-on-surface-variant/25'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                              {te?.icon ?? 'location_on'}
                            </span>
                            <p className="text-[11px] truncate flex-1 text-on-surface-variant/40">{loc.name}</p>
                          </div>
                        );
                      }

                      // Location with a marker — interactive button
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          onMouseEnter={() => setHoveredMarkerId(markerId)}
                          onMouseLeave={() => setHoveredMarkerId(null)}
                          onClick={() => setSelectedMarkerId((prev) => (prev === markerId ? null : markerId))}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all duration-150 outline-none border-l-2 ${
                            isSelected
                              ? 'bg-primary/10 border-l-primary'
                              : isHovered
                              ? 'bg-surface-container-high/60 border-l-primary/30'
                              : 'border-l-transparent hover:bg-surface-container-high/40 hover:border-l-outline-variant/30'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[15px] flex-shrink-0 transition-colors ${
                            isSelected ? 'text-primary' : te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/40'
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {te?.icon ?? 'location_on'}
                          </span>
                          <p className={`text-[11px] truncate flex-1 transition-colors ${
                            isSelected ? 'text-primary font-semibold' : 'text-on-surface'
                          }`}>{loc.name}</p>
                        </button>
                      );
                    })}
                  </div>
                ))}

                {/* Unlinked markers (NPC/free-text labels) */}
                {unlinkedMarkers.length > 0 && (
                  <div>
                    <div className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/30 flex items-center gap-2">
                      <span>Markers</span>
                      <div className="flex-1 h-px bg-outline-variant/10" />
                    </div>
                    {unlinkedMarkers.map((m) => {
                      const linkedNpc = npcsHere.find((n) => n.id === m.linkedNpcId);
                      const isHovered = hoveredMarkerId === m.id;
                      const isSelected = selectedMarkerId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onMouseEnter={() => setHoveredMarkerId(m.id)}
                          onMouseLeave={() => setHoveredMarkerId(null)}
                          onClick={() => setSelectedMarkerId((prev) => (prev === m.id ? null : m.id))}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all duration-150 outline-none border-l-2 ${
                            isSelected
                              ? 'bg-primary/10 border-l-primary'
                              : isHovered
                              ? 'bg-surface-container-high/60 border-l-primary/30'
                              : 'border-l-transparent hover:bg-surface-container-high/40 hover:border-l-outline-variant/30'
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[15px] flex-shrink-0 transition-colors ${
                            isSelected ? 'text-primary' : 'text-on-surface-variant/40'
                          }`} style={{ fontVariationSettings: "'FILL' 1" }}>place</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] truncate leading-tight transition-colors ${
                              isSelected ? 'text-primary font-semibold' : 'text-on-surface'
                            }`}>{m.label}</p>
                            {linkedNpc && <p className="text-[9px] text-emerald-400/70 truncate">{linkedNpc.name}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      </div>{/* end body row */}
    </div>
  );
}

const CATEGORY_ORDER = ['world', 'geographic', 'water', 'civilization', 'poi', 'travel'];

// ─────────────────────────────────────────────────────────────────────────────
// LocationDetailPage
// ─────────────────────────────────────────────────────────────────────────────

export default function LocationDetailPage() {
  const { id: campaignId, locationId } = useParams<{ id: string; locationId: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [editingNoteForNpcId, setEditingNoteForNpcId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [addNpcOpen, setAddNpcOpen] = useState(false);
  const [addNpcSearch, setAddNpcSearch] = useState('');
  const [confirmRemoveNpcId, setConfirmRemoveNpcId] = useState<string | null>(null);
  const [addChildLocOpen, setAddChildLocOpen] = useState(false);
  const [mapAddLocPoint, setMapAddLocPoint] = useState<{ x: number; y: number } | null>(null);
  const [mapAddLocDrawerOpen, setMapAddLocDrawerOpen] = useState(false);
  const [mapExternalMarker, setMapExternalMarker] = useState<MapMarker | null>(null);

  const { data: location, isLoading, isError } = useLocation(campaignId ?? '', locationId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allSessions } = useSessions(campaignId ?? '');
  const { data: locationTypes = [] } = useLocationTypes();
  const saveMutation = useSaveLocation(campaignId ?? '');
  const saveNpc = useSaveNpc();

  const typeMap = useMemo<TypeMap>(
    () => new Map(locationTypes.map((t) => [t.id, t])),
    [locationTypes],
  );

  const childLocations = useMemo(
    () => (allLocations?.filter((l) => l.parentLocationId === location?.id) ?? [])
      .sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
        const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
      }),
    [allLocations, location?.id, typeMap],
  );

  if (isLoading) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading…
      </main>
    );
  }

  if (isError || !location) {
    return (
      <main className="p-12">
        <Link
          to={`/campaigns/${campaignId}/locations`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest mb-8"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Locations
        </Link>
        <p className="text-tertiary text-sm">Location not found.</p>
      </main>
    );
  }

  // Parent location
  const parentLocation = location.parentLocationId
    ? allLocations?.find((l) => l.id === location.parentLocationId)
    : undefined;

  // Marker for THIS location on the parent's map
  const parentMarker = parentLocation?.mapMarkers?.find((m) => m.linkedLocationId === location.id);


  // Adjacent locations
  const adjacentLocations =
    location.adjacentLocationIds && location.adjacentLocationIds.length > 0
      ? allLocations?.filter((l) => location.adjacentLocationIds!.includes(l.id))
      : [];

  // NPCs at this location — match by locationPresences (ID) or by location name in legacy locations[]
  const npcsHere = (allNpcs?.filter((npc) =>
    npc.locationPresences?.some((p) => p.locationId === location.id) ||
    npc.locations.some((name) => name === location.name)
  ) ?? []).sort((a, b) => a.name.localeCompare(b.name));

  // Sessions that include this location, sorted descending
  const sessionAppearances = (allSessions ?? [])
    .filter((s) => s.locationIds?.includes(location.id))
    .sort((a, b) => b.number - a.number);

  const handleImageUpload = (dataUrl: string) => {
    saveMutation.mutate({ ...location, image: dataUrl });
  };

  const handleAddNpc = (npc: NPC) => {
    const presences = npc.locationPresences ? [...npc.locationPresences] : [];
    if (!presences.find((p) => p.locationId === location.id)) {
      presences.push({ locationId: location.id });
    }
    saveNpc.mutate({ ...npc, locationPresences: presences }, {
      onSuccess: () => { setAddNpcOpen(false); setAddNpcSearch(''); },
    });
  };

  const handleRemoveNpc = (npc: NPC) => {
    const presences = (npc.locationPresences ?? []).filter((p) => p.locationId !== location.id);
    const locations = npc.locations.filter((name) => name !== location.name);
    saveNpc.mutate({ ...npc, locationPresences: presences, locations });
  };

  const handleSaveNote = (npc: NPC, note: string) => {
    const presences = npc.locationPresences ? [...npc.locationPresences] : [];
    const idx = presences.findIndex((p) => p.locationId === location.id);
    if (idx >= 0) {
      presences[idx] = { ...presences[idx], note: note.trim() || undefined };
    } else {
      presences.push({ locationId: location.id, note: note.trim() || undefined });
    }
    saveNpc.mutate({ ...npc, locationPresences: presences }, {
      onSuccess: () => setEditingNoteForNpcId(null),
    });
  };

  return (
    <main className="flex-1 min-h-screen bg-surface">
      {/* Breadcrumb */}
      <div className="px-10 pt-8">
        <Link
          to={`/campaigns/${campaignId}/locations`}
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs uppercase tracking-widest transition-colors"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
          Locations
        </Link>
      </div>

      {/* Hero image — full width */}
      <div className="px-10 pt-4">
        <LocationPlaceholder
          name={location.name}
          imageUrl={location.image}
          onUpload={handleImageUpload}
          onOpenMap={() => setMapOpen(true)}
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Header */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {(() => {
                  const te = typeMap.get(location.type);
                  return (
                    <span className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-label tracking-widest uppercase rounded-sm border ${
                      te ? CATEGORY_BADGE_CLS[te.category] : 'bg-surface-container text-on-surface-variant border-outline-variant/10'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {te?.icon ?? 'location_on'}
                      </span>
                      {te?.name ?? location.type}
                    </span>
                  );
                })()}
                {location.settlementPopulation != null && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">people</span>
                    {location.settlementPopulation.toLocaleString()}
                  </span>
                )}
                {location.biome && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">terrain</span>
                    {location.biome.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                {location.name}
              </h1>
            </header>

            {/* Description */}
            <InlineRichField
              label="Description"
              value={location.description}
              onSave={(html) => saveMutation.mutate({ ...location, description: html })}
              placeholder="Describe this location…"
            />

            {/* GM Notes */}
            <InlineRichField
              label="GM Notes"
              value={location.gmNotes}
              onSave={(html) => saveMutation.mutate({ ...location, gmNotes: html || undefined })}
              isGmNotes
            />

            {/* Adjacent / Reachable */}
            {adjacentLocations && adjacentLocations.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Adjacent / Reachable
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {adjacentLocations.map((adj) => (
                    <Link
                      key={adj.id}
                      to={`/campaigns/${campaignId}/locations/${adj.id}`}
                      className="group flex items-center gap-3 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all"
                    >
                      <span className={`material-symbols-outlined transition-colors text-[18px] group-hover:text-secondary ${
                        (() => { const te = typeMap.get(adj.type); return te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/40'; })()
                      }`}>
                        {typeMap.get(adj.type)?.icon ?? 'location_on'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-headline text-on-surface group-hover:text-secondary transition-colors truncate">
                          {adj.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                          {typeMap.get(adj.type)?.name ?? adj.type}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* NPCs Here */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  NPCs Here
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
                <button
                  onClick={() => { setAddNpcOpen((v) => !v); setAddNpcSearch(''); }}
                  className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[13px]">person_add</span>
                  Add
                </button>
              </div>

              {/* NPC picker */}
              {addNpcOpen && (() => {
                const candidates = (allNpcs ?? []).filter(
                  (n) => !npcsHere.find((h) => h.id === n.id)
                );
                const shown = candidates.filter((n) =>
                  !addNpcSearch || n.name.toLowerCase().includes(addNpcSearch.toLowerCase())
                );
                return (
                  <div className="border border-outline-variant/20 bg-surface-container-low">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search NPCs…"
                        value={addNpcSearch}
                        onChange={(e) => setAddNpcSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {shown.length === 0 ? (
                        <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">No NPCs found.</p>
                      ) : (
                        shown.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => handleAddNpc(n)}
                            disabled={saveNpc.isPending}
                            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-40"
                          >
                            <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">person</span>
                            <span className="text-xs text-on-surface">{n.name}</span>
                            {n.species && <span className="text-[10px] text-on-surface-variant/40">{n.species}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })()}

              {npcsHere.length === 0 && !addNpcOpen ? (
                <p className="text-xs text-on-surface-variant/40 italic">
                  No NPCs tagged to this location.
                </p>
              ) : npcsHere.length > 0 ? (
                <div className="space-y-2">
                  {npcsHere.map((npc) => {
                    const initials = npc.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase();
                    const presence = npc.locationPresences?.find((p) => p.locationId === location.id);
                    const isEditingNote = editingNoteForNpcId === npc.id;
                    return (
                      <div key={npc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                        <div className="flex items-stretch">
                          <Link
                            to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                            className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
                          >
                            <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                              {npc.image ? (
                                <img src={npc.image} alt={npc.name} className="w-full h-full object-cover rounded-sm" />
                              ) : (
                                <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">
                                {npc.name}
                              </p>
                              {npc.species && (
                                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                                  {npc.species}
                                </p>
                              )}
                            </div>
                            <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                              arrow_forward
                            </span>
                          </Link>
                          {confirmRemoveNpcId === npc.id ? (
                            <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Remove?</span>
                              <button
                                onClick={() => { handleRemoveNpc(npc); setConfirmRemoveNpcId(null); }}
                                disabled={saveNpc.isPending}
                                className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors disabled:opacity-40"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmRemoveNpcId(null)}
                                className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmRemoveNpcId(npc.id)}
                              title="Remove from location"
                              className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                            >
                              <span className="material-symbols-outlined text-[14px]">person_remove</span>
                            </button>
                          )}
                        </div>
                        {/* Presence note */}
                        {isEditingNote ? (
                          <div className="px-3 pb-3 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                            <input
                              autoFocus
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(npc, noteInput);
                                if (e.key === 'Escape') setEditingNoteForNpcId(null);
                              }}
                              placeholder="e.g. Only here in the evenings…"
                              className="flex-1 bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveNote(npc, noteInput)}
                              disabled={saveNpc.isPending}
                              className="px-2 py-1 bg-primary text-on-primary text-[10px] rounded-sm uppercase tracking-wider disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNoteForNpcId(null)}
                              className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ) : (
                          <div
                            className="px-3 pb-2.5 flex items-center gap-1.5 cursor-pointer group/note"
                            onClick={() => {
                              setEditingNoteForNpcId(npc.id);
                              setNoteInput(presence?.note ?? '');
                            }}
                          >
                            {presence?.note ? (
                              <p className="text-[11px] text-on-surface-variant/60 italic flex-1">{presence.note}</p>
                            ) : (
                              <p className="text-[10px] text-on-surface-variant/20 italic flex-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                                Add presence note…
                              </p>
                            )}
                            <span className="material-symbols-outlined text-[12px] text-on-surface-variant/20 group-hover/note:text-primary/50 transition-colors opacity-0 group-hover/note:opacity-100">
                              edit
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>

            {/* Session Appearances */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Session Appearances
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              {sessionAppearances.length === 0 ? (
                <p className="text-xs text-on-surface-variant/40 italic">
                  No sessions tagged yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {sessionAppearances.map((session) => (
                    <Link
                      key={session.id}
                      to={`/campaigns/${campaignId}/sessions/${session.id}`}
                      className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[18px]">
                        auto_stories
                      </span>
                      <p className="text-sm text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                        Session {session.number} — {session.title}
                      </p>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right column (35%) ──────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            {/* Edit button */}
            <div className="flex justify-end">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary hover:border-primary/50 text-xs font-label uppercase tracking-widest rounded-sm transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Edit Location
              </button>
            </div>

            {/* Parent location */}
            {parentLocation && (
              <div>
                <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-3">
                  Part of
                </h4>
                <Link
                  to={`/campaigns/${campaignId}/locations/${parentLocation.id}`}
                  className="group flex items-center gap-3 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all rounded-sm"
                >
                  {(() => {
                    const te = typeMap.get(parentLocation.type);
                    return (
                      <span className={`w-10 h-10 rounded-sm flex items-center justify-center border flex-shrink-0 transition-all ${
                        te ? CATEGORY_TILE_CLS[te.category] : 'bg-surface-container-highest border-outline-variant/20'
                      }`}>
                        <span className={`material-symbols-outlined text-[18px] ${te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/40'}`}>
                          {te?.icon ?? 'location_on'}
                        </span>
                      </span>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-headline text-on-surface group-hover:text-primary transition-colors truncate">
                      {parentLocation.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                      {typeMap.get(parentLocation.type)?.name ?? parentLocation.type}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    arrow_forward
                  </span>
                </Link>
              </div>
            )}

            {/* Mini-map: this location's marker on the parent's map */}
            {parentLocation && parentLocation.image && parentMarker && (
              <div>
                <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[13px] text-primary">my_location</span>
                  On the map of {parentLocation.name}
                </h4>
                <Link
                  to={`/campaigns/${campaignId}/locations/${parentLocation.id}`}
                  className="block relative group/minimap rounded-sm overflow-hidden"
                >
                  <MiniMapPreview
                    imageUrl={parentLocation.image}
                    markerX={parentMarker.x}
                    markerY={parentMarker.y}
                    markerLabel={parentMarker.label}
                    markerIcon={typeMap.get(location.type)?.icon ?? 'location_on'}
                    markerIconColor={(() => { const te = typeMap.get(location.type); return te ? CATEGORY_ICON_COLOR[te.category] : 'text-primary'; })()}
                    markerBubbleCls={(() => { const te = typeMap.get(location.type); return te ? (CATEGORY_MARKER_CLS[te.category]?.bubble ?? MARKER_DEFAULT_CLS.bubble) : MARKER_DEFAULT_CLS.bubble; })()}
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end justify-end p-2.5 opacity-0 group-hover/minimap:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface/90 backdrop-blur-sm border border-outline-variant/30 rounded-sm text-[10px] font-label uppercase tracking-widest text-primary">
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                      Open {parentLocation.name}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Notable Places — child locations */}
            <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    Notable Places
                  </h4>
                  <div className="h-px flex-1 bg-outline-variant/10" />
                  <button
                    onClick={() => setAddChildLocOpen(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[13px]">add_location_alt</span>
                    Add
                  </button>
                </div>

                <div className="space-y-1.5">
                  {childLocations.map((child) => {
                    const hasMarker = (location.mapMarkers ?? []).some((mk) => mk.linkedLocationId === child.id);
                    const te = typeMap.get(child.type);
                    return (
                      <Link
                        key={child.id}
                        to={`/campaigns/${campaignId}/locations/${child.id}`}
                        className="group flex items-center gap-2.5 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all rounded-sm"
                      >
                        <span className={`material-symbols-outlined transition-colors text-[16px] group-hover:text-primary ${
                          te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/40'
                        }`}>
                          {te?.icon ?? 'location_on'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">
                            {child.name}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40">
                            {te?.name ?? child.type}
                          </p>
                        </div>
                        {hasMarker && (
                          <span className="material-symbols-outlined text-[13px] text-on-surface-variant/30 flex-shrink-0">
                            location_on
                          </span>
                        )}
                        <span className="material-symbols-outlined text-[12px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          arrow_forward
                        </span>
                      </Link>
                    );
                  })}
                </div>
            </div>


          </div>
        </div>
      </div>

      <LocationEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId ?? ''}
        location={location}
      />
      <LocationEditDrawer
        open={addChildLocOpen}
        onClose={() => setAddChildLocOpen(false)}
        campaignId={campaignId ?? ''}
        initialParentId={location.id}
      />

      {mapOpen && location.image && (
        <MapViewer
          imageUrl={location.image}
          locationId={location.id}
          locationName={location.name}
          initialMarkers={location.mapMarkers ?? []}
          childLocations={childLocations}
          npcsHere={npcsHere}
          campaignId={campaignId ?? ''}
          typeMap={typeMap}
          onClose={() => setMapOpen(false)}
          onSave={(markers) => saveMutation.mutate({ ...location, mapMarkers: markers })}
          onRequestAddLocation={(point) => {
            setMapAddLocPoint(point);
            setMapAddLocDrawerOpen(true);
          }}
          externalMarkerToAdd={mapExternalMarker}
          onExternalMarkerAdded={() => setMapExternalMarker(null)}
        />
      )}

      {/* Page-level drawer for "Add Location from map" flow */}
      <LocationEditDrawer
        open={mapAddLocDrawerOpen}
        onClose={() => { setMapAddLocDrawerOpen(false); setMapAddLocPoint(null); }}
        campaignId={campaignId ?? ''}
        initialParentId={location.id}
        elevated
        onSaved={(saved) => {
          if (!mapAddLocPoint) return;
          setMapExternalMarker({
            id: `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            x: mapAddLocPoint.x,
            y: mapAddLocPoint.y,
            label: saved.name,
            linkedLocationId: saved.id,
          });
          setMapAddLocPoint(null);
        }}
      />
    </main>
  );
}
