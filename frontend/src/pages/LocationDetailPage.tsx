import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocation, useLocations, useSaveLocation } from '@/features/locations/api';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useNpcs } from '@/features/npcs/api/queries';
import { useSessions } from '@/features/sessions/api';
import type { Location, LocationType, MapMarker } from '@/entities/location';
import type { NPC } from '@/entities/npc';

const TYPE_ICON: Record<LocationType, string> = {
  region: 'map',
  settlement: 'location_city',
  district: 'holiday_village',
  building: 'domain',
  natural: 'forest',
  dungeon: 'skull',
};

const TYPE_LABEL: Record<LocationType, string> = {
  region: 'Region',
  settlement: 'Settlement',
  district: 'District',
  building: 'Building',
  natural: 'Natural Feature',
  dungeon: 'Dungeon',
};

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
  markerNumber,
}: {
  imageUrl: string;
  markerX: number;
  markerY: number;
  markerLabel: string;
  markerNumber: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgStyle, setImgStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const cW = container.offsetWidth;
    const cH = container.offsetHeight;
    const displayW = MINI_ZOOM * cW;
    const displayH = displayW * (img.naturalHeight / img.naturalWidth);

    // Position image so that the marker % point is at the container center
    const left = cW / 2 - (markerX / 100) * displayW;
    const top = cH / 2 - (markerY / 100) * displayH;

    setImgStyle({ position: 'absolute', width: displayW, height: displayH, maxWidth: 'none', left, top, opacity: 1, transition: 'opacity 0.3s' });
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden h-44 rounded-sm bg-surface-container-low group">
      <img src={imageUrl} alt="" draggable={false} style={imgStyle} onLoad={handleLoad} />
      {/* Pin at container center */}
      <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 10 }}>
        <div className="flex flex-col items-center" style={{ userSelect: 'none' }}>
          <div className="w-7 h-7 rounded-full border-2 border-primary bg-surface-container shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center text-primary text-[11px] font-bold leading-none">
            {markerNumber}
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
  locationName: string;
  initialMarkers: MapMarker[];
  childLocations: Location[];
  npcsHere: NPC[];
  campaignId: string;
  onClose: () => void;
  onSave: (markers: MapMarker[]) => void;
}

function markerColor(_m: MapMarker): string {
  return 'bg-surface-container border-primary';
}

function MapViewer({
  imageUrl,
  locationName,
  initialMarkers,
  childLocations,
  npcsHere,
  campaignId,
  onClose,
  onSave,
}: MapViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [addMode, setAddMode] = useState(false);
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    startMx: number;
    startMy: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [panning, setPanning] = useState<{
    startMx: number;
    startMy: number;
    startTx: number;
    startTy: number;
  } | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [pendingMarker, setPendingMarker] = useState<{ x: number; y: number } | null>(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [pendingLinkedLocationId, setPendingLinkedLocationId] = useState('');
  const [pendingLinkedNpcId, setPendingLinkedNpcId] = useState('');

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

  const addPendingMarker = useCallback(() => {
    if (!pendingMarker) return;
    // If label is empty but a location is linked, use the location name automatically
    const autoLabel =
      pendingLabel.trim() ||
      (pendingLinkedLocationId
        ? childLocations.find((l) => l.id === pendingLinkedLocationId)?.name ?? ''
        : '') ||
      (pendingLinkedNpcId
        ? npcsHere.find((n) => n.id === pendingLinkedNpcId)?.name ?? ''
        : '');
    if (!autoLabel) return;
    const newMarker: MapMarker = {
      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      x: pendingMarker.x,
      y: pendingMarker.y,
      label: autoLabel,
      linkedLocationId: pendingLinkedLocationId || undefined,
      linkedNpcId: pendingLinkedNpcId || undefined,
    };
    setMarkers((prev) => [...prev, newMarker]);
    setPendingMarker(null);
    setPendingLabel('');
    setPendingLinkedLocationId('');
    setPendingLinkedNpcId('');
  }, [pendingMarker, pendingLabel, pendingLinkedLocationId, pendingLinkedNpcId, childLocations, npcsHere]);

  // ── Mouse handlers ──────────────────────────────────────────────────────────

  const onViewportMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-marker]') || target.closest('[data-popup]')) return;
    setHasMoved(false);
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
        setHasMoved(true);
      }
      setTranslate({ x: panning.startTx + dx, y: panning.startTy + dy });
    }
    if (dragging) {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const imgX = (e.clientX - rect.left) / scale;
      const imgY = (e.clientY - rect.top) / scale;
      const pctX = Math.max(0, Math.min(100, (imgX / container.offsetWidth) * 100));
      const pctY = Math.max(0, Math.min(100, (imgY / container.offsetHeight) * 100));
      setMarkers((prev) =>
        prev.map((m) => (m.id === dragging.id ? { ...m, x: pctX, y: pctY } : m)),
      );
    }
  };

  const onViewportMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    const didMove = hasMoved;
    setPanning(null);
    setDragging(null);
    setHasMoved(false);

    const target = e.target as HTMLElement;
    if (target.closest('[data-marker]') || target.closest('[data-popup]')) return;

    if (selectedMarkerId) {
      setSelectedMarkerId(null);
      return;
    }
    if (pendingMarker) {
      setPendingMarker(null);
      return;
    }
    if (addMode && !didMove) {
      const coords = toImageCoords(e.clientX, e.clientY);
      setPendingMarker(coords);
      setPendingLabel('');
      setPendingLinkedLocationId('');
      setPendingLinkedNpcId('');
      setSelectedMarkerId(null);
    }
  };

  const onViewportMouseLeave = () => {
    setPanning(null);
    setDragging(null);
  };

  const onMarkerMouseDown = (e: React.MouseEvent, markerId: string) => {
    e.stopPropagation();
    const marker = markers.find((m) => m.id === markerId);
    if (!marker) return;
    setDragging({
      id: markerId,
      startMx: e.clientX,
      startMy: e.clientY,
      startX: marker.x,
      startY: marker.y,
    });
    setHasMoved(false);
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  const cursorStyle =
    panning ? 'grabbing' : addMode ? 'crosshair' : 'grab';

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
            onClick={() => { setAddMode((v) => !v); setPendingMarker(null); setSelectedMarkerId(null); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm border transition-colors ${
              addMode
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-sm">add_location</span>
            Add Marker
          </button>
          <button
            onClick={() => { onSave(markers); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save &amp; Close
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
            title="Close without saving"
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
          {markers.map((m, index) => (
            <div
              key={m.id}
              data-marker="true"
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                transform: 'translate(-50%, -100%)',
                cursor: 'pointer',
                zIndex: 10,
              }}
              onMouseDown={(e) => onMarkerMouseDown(e, m.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (!hasMoved) {
                  setSelectedMarkerId((prev) => (prev === m.id ? null : m.id));
                  setPendingMarker(null);
                }
              }}
            >
              <div className="flex flex-col items-center" style={{ userSelect: 'none' }}>
                {/* Number bubble */}
                <div
                  className={`w-7 h-7 rounded-full border-2 shadow-[0_2px_8px_rgba(0,0,0,0.8)] ${markerColor(m)} ${
                    selectedMarkerId === m.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-black/50 scale-110' : ''
                  } flex items-center justify-center text-primary text-[11px] font-bold leading-none transition-transform`}
                >
                  {index + 1}
                </div>
                {/* Label */}
                <div className="mt-0.5 px-1.5 py-0.5 rounded-sm text-[10px] font-medium text-on-surface bg-surface-container border border-outline-variant/40 leading-tight whitespace-nowrap max-w-[128px] truncate shadow-md">
                  {m.label}
                </div>
                {/* Pin tail */}
                <div className="w-px h-2 bg-outline-variant/60" />
              </div>
            </div>
          ))}
        </div>

        {/* Selected marker popup — positioned relative to viewportRef */}
        {selectedMarker &&
          (() => {
            const pos = getMarkerViewportPos(selectedMarker);
            const linkedLocation = childLocations.find((l) => l.id === selectedMarker.linkedLocationId);
            const linkedNpc = npcsHere.find((n) => n.id === selectedMarker.linkedNpcId);
            return (
              <div
                data-popup="true"
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, calc(-100% - 14px))',
                  zIndex: 50,
                }}
                className="bg-surface-container border border-outline-variant/30 rounded-sm shadow-xl p-3 w-52 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-headline font-bold text-on-surface">{selectedMarker.label}</span>
                  <button
                    onClick={() => setSelectedMarkerId(null)}
                    className="text-on-surface-variant/40 hover:text-on-surface ml-2"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
                {linkedLocation && (
                  <Link
                    to={`/campaigns/${campaignId}/locations/${linkedLocation.id}`}
                    onClick={onClose}
                    className="block text-[11px] text-secondary hover:text-secondary/80 mb-1 truncate"
                  >
                    → {linkedLocation.name}
                  </Link>
                )}
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
                    setMarkers((prev) => prev.filter((m) => m.id !== selectedMarkerId));
                    setSelectedMarkerId(null);
                  }}
                  className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 mt-2"
                >
                  <span className="material-symbols-outlined text-xs">delete</span>
                  Delete marker
                </button>
              </div>
            );
          })()}

        {/* Pending marker popup */}
        {pendingMarker &&
          (() => {
            const pos = getMarkerViewportPos(pendingMarker as MapMarker);
            return (
              <div
                data-popup="true"
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: 'translate(-50%, calc(-100% - 14px))',
                  zIndex: 50,
                }}
                className="bg-surface-container border border-primary/40 rounded-sm shadow-xl p-3 w-56 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="text-[9px] uppercase tracking-widest text-primary mb-2">New Marker</p>
                <input
                  autoFocus
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addPendingMarker();
                    if (e.key === 'Escape') setPendingMarker(null);
                  }}
                  placeholder={pendingLinkedLocationId || pendingLinkedNpcId ? 'Label (optional)…' : 'Label…'}
                  className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm px-2 py-1 rounded-sm outline-none focus:border-primary/60 mb-2"
                />
                {childLocations.length > 0 && (
                  <select
                    value={pendingLinkedLocationId}
                    onChange={(e) => {
                      setPendingLinkedLocationId(e.target.value);
                      if (e.target.value) setPendingLinkedNpcId('');
                    }}
                    className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-[11px] px-2 py-1 rounded-sm mb-2"
                  >
                    <option value="">Link to location…</option>
                    {childLocations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                )}
                {npcsHere.length > 0 && (
                  <select
                    value={pendingLinkedNpcId}
                    onChange={(e) => {
                      setPendingLinkedNpcId(e.target.value);
                      if (e.target.value) setPendingLinkedLocationId('');
                    }}
                    className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-[11px] px-2 py-1 rounded-sm mb-2"
                  >
                    <option value="">Link to NPC…</option>
                    {npcsHere.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={addPendingMarker}
                    disabled={!pendingLabel.trim() && !pendingLinkedLocationId && !pendingLinkedNpcId}
                    className="flex-1 py-1 bg-primary text-on-primary text-[10px] uppercase tracking-wider rounded-sm disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setPendingMarker(null)}
                    className="px-2 py-1 border border-outline-variant/30 text-on-surface-variant text-[10px] rounded-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

        {/* Zoom hint */}
        <div className="absolute bottom-4 left-4 text-[10px] text-white/30 pointer-events-none select-none">
          Scroll to zoom · Drag to pan{addMode ? ' · Click to place' : ''} · {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Marker list sidebar */}
      <div className="w-56 flex-shrink-0 bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex-shrink-0">
          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/50 font-label">
            Markers
            {markers.length > 0 && (
              <span className="ml-1.5 text-primary">{markers.length}</span>
            )}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
          {markers.length === 0 ? (
            <p className="text-[10px] text-on-surface-variant/30 italic px-4 pt-4">
              No markers yet.
            </p>
          ) : (
            <div className="py-2">
              {markers.map((m, index) => {
                const linkedLoc = childLocations.find((l) => l.id === m.linkedLocationId);
                const linkedNpc = npcsHere.find((n) => n.id === m.linkedNpcId);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMarkerId((prev) => (prev === m.id ? null : m.id));
                      setPendingMarker(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors hover:bg-surface-container ${
                      selectedMarkerId === m.id ? 'bg-surface-container' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-primary text-[9px] font-bold border-2 ${markerColor(m)}`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-on-surface truncate leading-tight">{m.label}</p>
                      {linkedLoc && (
                        <p className="text-[9px] text-secondary truncate mt-0.5">{linkedLoc.name}</p>
                      )}
                      {linkedNpc && (
                        <p className="text-[9px] text-emerald-400 truncate mt-0.5">{linkedNpc.name}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      </div>{/* end body row */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LocationDetailPage
// ─────────────────────────────────────────────────────────────────────────────

export default function LocationDetailPage() {
  const { id: campaignId, locationId } = useParams<{ id: string; locationId: string }>();
  const [editOpen, setEditOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const { data: location, isLoading, isError } = useLocation(campaignId ?? '', locationId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allSessions } = useSessions(campaignId ?? '');
  const saveMutation = useSaveLocation(campaignId ?? '');

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

  // Child locations
  const childLocations = allLocations?.filter((l) => l.parentLocationId === location.id) ?? [];

  // Marker for THIS location on the parent's map
  const parentMarker = parentLocation?.mapMarkers?.find((m) => m.linkedLocationId === location.id);
  const parentMarkerIndex = parentMarker
    ? (parentLocation?.mapMarkers?.indexOf(parentMarker) ?? -1)
    : -1;

  // Adjacent locations
  const adjacentLocations =
    location.adjacentLocationIds && location.adjacentLocationIds.length > 0
      ? allLocations?.filter((l) => location.adjacentLocationIds!.includes(l.id))
      : [];

  // NPCs at this location
  const npcsHere = allNpcs?.filter((npc) => npc.locations.includes(location.id)) ?? [];

  // Sessions that include this location, sorted descending
  const sessionAppearances = (allSessions ?? [])
    .filter((s) => s.locationIds?.includes(location.id))
    .sort((a, b) => b.number - a.number);

  const handleImageUpload = (dataUrl: string) => {
    saveMutation.mutate({ ...location, image: dataUrl });
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
                <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                  <span className="material-symbols-outlined text-[14px]">
                    {TYPE_ICON[location.type]}
                  </span>
                  {TYPE_LABEL[location.type]}
                </span>
                {location.subtype && (
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                    {location.subtype}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                {location.name}
              </h1>
              {location.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {location.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic"
                    >
                      "{alias}"
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Description */}
            <section className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Description
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              <p className="text-on-surface-variant leading-loose text-base">
                {location.description}
              </p>
            </section>

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
                      <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-secondary transition-colors text-[18px]">
                        {TYPE_ICON[adj.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-headline text-on-surface group-hover:text-secondary transition-colors truncate">
                          {adj.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                          {TYPE_LABEL[adj.type]}
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
              </div>
              {npcsHere.length === 0 ? (
                <p className="text-xs text-on-surface-variant/40 italic">
                  No NPCs tagged to this location.
                </p>
              ) : (
                <div className="space-y-2">
                  {npcsHere.map((npc) => {
                    const initials = npc.name
                      .split(' ')
                      .slice(0, 2)
                      .map((w: string) => w[0])
                      .join('')
                      .toUpperCase();
                    return (
                      <Link
                        key={npc.id}
                        to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                        className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all"
                      >
                        <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                          {npc.image ? (
                            <img src={npc.image} alt={npc.name} className="w-full h-full object-cover rounded-sm" />
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-headline text-on-surface group-hover:text-primary transition-colors truncate">
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
                    );
                  })}
                </div>
              )}
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
                  <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[18px]">
                    {TYPE_ICON[parentLocation.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-headline text-on-surface group-hover:text-primary transition-colors truncate">
                      {parentLocation.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                      {TYPE_LABEL[parentLocation.type]}
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
                <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[13px] text-primary">my_location</span>
                  On the map of {parentLocation.name}
                </h4>
                <MiniMapPreview
                  imageUrl={parentLocation.image}
                  markerX={parentMarker.x}
                  markerY={parentMarker.y}
                  markerLabel={parentMarker.label}
                  markerNumber={parentMarkerIndex + 1}
                />
                <Link
                  to={`/campaigns/${campaignId}/locations/${parentLocation.id}`}
                  className="mt-1.5 flex items-center gap-1 text-[9px] text-on-surface-variant/50 hover:text-primary uppercase tracking-widest transition-colors"
                >
                  <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                  Open {parentLocation.name}
                </Link>
              </div>
            )}

            {/* Notable Places — child locations */}
            {childLocations && childLocations.length > 0 && (
              <div>
                <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-3">
                  Notable Places
                </h4>
                <div className="space-y-1.5">
                  {childLocations.map((child) => {
                    const markerIdx = location.mapMarkers?.findIndex((mk) => mk.linkedLocationId === child.id) ?? -1;
                    return (
                      <Link
                        key={child.id}
                        to={`/campaigns/${campaignId}/locations/${child.id}`}
                        className="group flex items-center gap-2.5 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all rounded-sm"
                      >
                        <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[16px]">
                          {TYPE_ICON[child.type]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-headline text-on-surface group-hover:text-primary transition-colors truncate">
                            {child.name}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40">
                            {TYPE_LABEL[child.type]}
                          </p>
                        </div>
                        {markerIdx >= 0 && (
                          <span className="w-4 h-4 rounded-full bg-surface-container border border-primary flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
                            {markerIdx + 1}
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
            )}

            {/* GM Notes */}
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
                  <h4 className="text-[10px] font-label uppercase tracking-widest text-primary">
                    GM Notes
                  </h4>
                </div>
                <p className="text-sm text-on-surface-variant/90 leading-relaxed italic">
                  {location.gmNotes ?? 'No GM notes.'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <LocationEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        location={location}
      />

      {mapOpen && location.image && (
        <MapViewer
          imageUrl={location.image}
          locationName={location.name}
          initialMarkers={location.mapMarkers ?? []}
          childLocations={childLocations}
          npcsHere={npcsHere}
          campaignId={campaignId ?? ''}
          onClose={() => setMapOpen(false)}
          onSave={(markers) => saveMutation.mutate({ ...location, mapMarkers: markers })}
        />
      )}
    </main>
  );
}
