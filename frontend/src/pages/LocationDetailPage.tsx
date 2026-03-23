import { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocation, useLocations, useSaveLocation } from '@/features/locations/api';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useNpcs, useSaveNpc } from '@/features/npcs/api/queries';
import { useSessions } from '@/features/sessions/api';
import type { Location, LocationType, MapMarker, SettlementType, Climate } from '@/entities/location';
import type { NPC } from '@/entities/npc';

const TYPE_ICON: Record<LocationType, string> = {
  region: 'map',
  settlement: 'location_city',
  district: 'holiday_village',
  building: 'domain',
  dungeon: 'skull',
};

const TYPE_LABEL: Record<LocationType, string> = {
  region: 'Region',
  settlement: 'Settlement',
  district: 'District',
  building: 'Building',
  dungeon: 'Dungeon',
};

const SETTLEMENT_TYPE_LABEL: Record<SettlementType, string> = {
  village:    'Village',
  town:       'Town',
  city:       'City',
  metropolis: 'Metropolis',
};

const SETTLEMENT_TYPE_ICON: Record<SettlementType, string> = {
  village:    'cottage',
  town:       'holiday_village',
  city:       'apartment',
  metropolis: 'corporate_fare',
};

const CLIMATE_LABEL: Record<Climate, string> = {
  arctic: 'Arctic',
  subarctic: 'Subarctic',
  temperate: 'Temperate',
  continental: 'Continental',
  maritime: 'Maritime',
  subtropical: 'Subtropical',
  tropical: 'Tropical',
  arid: 'Arid',
  'semi-arid': 'Semi-Arid',
  highland: 'Highland',
};

const CLIMATE_ICON: Record<Climate, string> = {
  arctic: 'ac_unit',
  subarctic: 'snowing',
  temperate: 'partly_cloudy_day',
  continental: 'wb_cloudy',
  maritime: 'waves',
  subtropical: 'wb_sunny',
  tropical: 'local_florist',
  arid: 'light_mode',
  'semi-arid': 'wb_twilight',
  highland: 'landscape',
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
  onCreateChildLocation: (name: string, type: LocationType, id: string) => void;
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
  onCreateChildLocation,
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
    offsetX: number;
    offsetY: number;
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
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [addLocMode, setAddLocMode] = useState(false);
  const [pendingLocPoint, setPendingLocPoint] = useState<{ x: number; y: number } | null>(null);
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<LocationType>('building');
  const [quickLinkLocId, setQuickLinkLocId] = useState<string | null>(null);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [editMarkerLabel, setEditMarkerLabel] = useState('');
  const [editMarkerLinkedLocationId, setEditMarkerLinkedLocationId] = useState('');

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
    const updated = [...markers, newMarker];
    setMarkers(updated);
    onSave(updated);
    setPendingMarker(null);
    setPendingLabel('');
    setPendingLinkedLocationId('');
    setPendingLinkedNpcId('');
  }, [pendingMarker, pendingLabel, pendingLinkedLocationId, pendingLinkedNpcId, childLocations, npcsHere, markers, onSave]);

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
      setHasMoved(true);
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // Subtract the stored offset so the pin tip follows the cursor without jumping
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
    if (addLocMode && !didMove) {
      const coords = toImageCoords(e.clientX, e.clientY);
      setPendingLocPoint(coords);
      setAddLocMode(false);
      setNewLocName('');
      setNewLocType('building');
      return;
    }
    if (addMode && !didMove) {
      const coords = toImageCoords(e.clientX, e.clientY);
      if (quickLinkLocId) {
        const loc = childLocations.find((l) => l.id === quickLinkLocId);
        if (loc) {
          const newMarker: MapMarker = {
            id: `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            x: coords.x,
            y: coords.y,
            label: loc.name,
            linkedLocationId: loc.id,
          };
          const updated = [...markers, newMarker];
          setMarkers(updated);
          onSave(updated);
          setQuickLinkLocId(null);
          setAddMode(false);
          return;
        }
      }
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
    const container = containerRef.current;
    if (!marker || !container) return;
    // Compute the pin-tip position in screen pixels, store offset so drag has no jump
    const rect = container.getBoundingClientRect();
    const pinScreenX = rect.left + (marker.x / 100) * rect.width;
    const pinScreenY = rect.top + (marker.y / 100) * rect.height;
    setDragging({ id: markerId, offsetX: e.clientX - pinScreenX, offsetY: e.clientY - pinScreenY });
    setHasMoved(false);
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;
  // Close edit mode whenever selection changes
  useEffect(() => { setEditingMarkerId(null); }, [selectedMarkerId]);

  const cursorStyle =
    panning ? 'grabbing' : (addMode || addLocMode) ? 'crosshair' : 'grab';

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
            onClick={() => { setAddMode((v) => !v); setAddLocMode(false); setPendingMarker(null); setPendingLocPoint(null); setSelectedMarkerId(null); setQuickLinkLocId(null); }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-label uppercase tracking-widest rounded-sm border border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_location</span>
            Add Marker
          </button>
          <button
            onClick={() => { setAddLocMode((v) => !v); setAddMode(false); setPendingMarker(null); setPendingLocPoint(null); setSelectedMarkerId(null); setQuickLinkLocId(null); }}
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
              onMouseEnter={() => setHoveredMarkerId(m.id)}
              onMouseLeave={() => setHoveredMarkerId(null)}
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
                  className={`w-7 h-7 rounded-full border-2 ${markerColor(m)} flex items-center justify-center text-primary text-[11px] font-bold leading-none transition-all duration-150 ${
                    selectedMarkerId === m.id
                      ? 'shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_16px_6px_rgba(var(--color-primary)/0.7)] ring-2 ring-primary ring-offset-2 ring-offset-black/50 scale-130'
                      : hoveredMarkerId === m.id
                      ? 'shadow-[0_2px_8px_rgba(0,0,0,0.8),0_0_22px_8px_rgba(255,255,255,0.5)] scale-130 brightness-150 ring-1 ring-white/40'
                      : 'shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                  }`}
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
            const isEditing = editingMarkerId === selectedMarker.id;
            // Locations available to link: exclude ones already linked to other markers
            const availableForLink = childLocations.filter(
              (l) => !markers.find((m) => m.linkedLocationId === l.id && m.id !== selectedMarker.id)
            );
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
                className="bg-surface-container border border-outline-variant/30 rounded-sm shadow-xl p-3 w-56 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isEditing ? (
                  <>
                    <p className="text-[9px] uppercase tracking-widest text-primary mb-2">Edit Marker</p>
                    <input
                      autoFocus
                      value={editMarkerLabel}
                      onChange={(e) => setEditMarkerLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingMarkerId(null);
                      }}
                      placeholder="Label…"
                      className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm px-2 py-1 rounded-sm outline-none focus:border-primary/60 mb-2"
                    />
                    {/* Location link selector */}
                    {availableForLink.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mb-1">Link to location</p>
                        <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
                          {availableForLink.map((l) => (
                            <button
                              key={l.id}
                              onClick={() =>
                                setEditMarkerLinkedLocationId((prev) => (prev === l.id ? '' : l.id))
                              }
                              className={`text-left px-2 py-1 text-[11px] rounded-sm flex items-center gap-1.5 transition-all ${
                                editMarkerLinkedLocationId === l.id
                                  ? 'bg-primary/15 text-primary border-l-2 border-l-primary'
                                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-2 border-l-transparent'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[11px] flex-shrink-0">{TYPE_ICON[l.type]}</span>
                              <span className="truncate">{l.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const autoLabel = editMarkerLabel.trim() ||
                            (editMarkerLinkedLocationId
                              ? childLocations.find((l) => l.id === editMarkerLinkedLocationId)?.name ?? ''
                              : '');
                          if (!autoLabel) return;
                          const updated = markers.map((m) =>
                            m.id === selectedMarker.id
                              ? { ...m, label: autoLabel, linkedLocationId: editMarkerLinkedLocationId || undefined }
                              : m
                          );
                          setMarkers(updated);
                          onSave(updated);
                          setEditingMarkerId(null);
                        }}
                        disabled={!editMarkerLabel.trim() && !editMarkerLinkedLocationId}
                        className="flex-1 py-1 bg-primary text-on-primary text-[10px] uppercase tracking-wider rounded-sm disabled:opacity-40"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingMarkerId(null)}
                        className="px-2 py-1 border border-outline-variant/30 text-on-surface-variant text-[10px] rounded-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingMarkerId(selectedMarker.id);
                            setEditMarkerLabel(selectedMarker.linkedLocationId ? '' : selectedMarker.label);
                            setEditMarkerLinkedLocationId(selectedMarker.linkedLocationId ?? '');
                          }}
                          className="text-on-surface-variant/40 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => setSelectedMarkerId(null)}
                          className="text-on-surface-variant/40 hover:text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
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
                      className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 mt-2"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      Delete marker
                    </button>
                  </>
                )}
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
                {(() => {
                  const available = childLocations.filter(
                    (l) => !markers.find((m) => m.linkedLocationId === l.id)
                  );
                  return available.length > 0 ? (
                    <div className="mb-2">
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mb-1">Link to location</p>
                      <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
                        {available.map((l) => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setPendingLinkedLocationId((prev) => prev === l.id ? '' : l.id);
                              setPendingLinkedNpcId('');
                            }}
                            className={`text-left px-2 py-1 text-[11px] rounded-sm flex items-center gap-1.5 transition-all ${
                              pendingLinkedLocationId === l.id
                                ? 'bg-primary/15 text-primary border-l-2 border-l-primary'
                                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-l-2 border-l-transparent'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[11px] flex-shrink-0">{TYPE_ICON[l.type]}</span>
                            <span className="truncate">{l.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                {false && npcsHere.length > 0 && (
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

        {/* Pending location popup */}
        {pendingLocPoint && (() => {
          const pos = getMarkerViewportPos(pendingLocPoint as MapMarker);
          return (
            <div
              data-popup="true"
              style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, calc(-100% - 14px))', zIndex: 50 }}
              className="bg-surface-container border border-primary/40 rounded-sm shadow-xl p-3 w-60 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="text-[9px] uppercase tracking-widest text-primary mb-2">New Location</p>
              <input
                autoFocus
                type="text"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLocName.trim()) {
                    const locId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    onCreateChildLocation(newLocName.trim(), newLocType, locId);
                    const newM: MapMarker = {
                      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      x: pendingLocPoint.x,
                      y: pendingLocPoint.y,
                      label: newLocName.trim(),
                      linkedLocationId: locId,
                    };
                    const updated = [...markers, newM];
                    setMarkers(updated);
                    onSave(updated);
                    setPendingLocPoint(null);
                    setNewLocName('');
                  }
                  if (e.key === 'Escape') { setPendingLocPoint(null); }
                }}
                placeholder="Location name…"
                className="w-full bg-surface-container-low border border-outline-variant/30 text-on-surface text-sm px-2 py-1 rounded-sm outline-none focus:border-primary/60 mb-2"
              />
              <div className="flex flex-wrap gap-1 mb-2">
                {(['region','settlement','district','building','dungeon'] as LocationType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewLocType(t)}
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wide rounded-sm transition-all ${
                      newLocType === t ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[10px]">{TYPE_ICON[t]}</span>
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!newLocName.trim()) return;
                    const locId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                    onCreateChildLocation(newLocName.trim(), newLocType, locId);
                    const newM: MapMarker = {
                      id: `marker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      x: pendingLocPoint.x,
                      y: pendingLocPoint.y,
                      label: newLocName.trim(),
                      linkedLocationId: locId,
                    };
                    const updated = [...markers, newM];
                    setMarkers(updated);
                    onSave(updated);
                    setPendingLocPoint(null);
                    setNewLocName('');
                  }}
                  disabled={!newLocName.trim()}
                  className="flex-1 py-1 bg-primary text-on-primary text-[10px] uppercase tracking-wider rounded-sm disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  onClick={() => setPendingLocPoint(null)}
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
          Scroll to zoom · Drag to pan{(addMode || addLocMode || quickLinkLocId) ? ' · Click to place' : ''} · {Math.round(scale * 100)}%
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
            // Locations sorted: with marker first (by marker order), then without
            const locationsWithMarker = (childLocations
              .map((loc) => ({ loc, marker: markers.find((m) => m.linkedLocationId === loc.id) ?? null }))
              .filter(({ marker }) => marker !== null) as { loc: Location; marker: MapMarker }[])
              .sort((a, b) => markers.indexOf(a.marker) - markers.indexOf(b.marker));
            const locationsWithoutMarker = childLocations.filter(
              (loc) => !markers.find((m) => m.linkedLocationId === loc.id)
            );
            // Markers not linked to any location
            const unlinkedMarkers = markers.filter((m) => !m.linkedLocationId);

            const isEmpty = childLocations.length === 0 && markers.length === 0;
            if (isEmpty) {
              return <p className="text-[10px] text-on-surface-variant/30 italic px-4 pt-4">No locations or markers yet.</p>;
            }

            return (
              <div className="py-1">
                {/* Locations with marker */}
                {locationsWithMarker.map(({ loc, marker }) => {
                  const index = markers.indexOf(marker);
                  const isHovered = hoveredMarkerId === marker.id;
                  const isSelected = selectedMarkerId === marker.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onMouseEnter={() => setHoveredMarkerId(marker.id)}
                      onMouseLeave={() => setHoveredMarkerId(null)}
                      onClick={() => {
                        setSelectedMarkerId((prev) => (prev === marker.id ? null : marker.id));
                        setPendingMarker(null);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all duration-150 outline-none ${
                        isSelected
                          ? 'bg-primary/15 border-l-2 border-l-primary text-primary'
                          : isHovered
                          ? 'bg-surface-container-high border-l-2 border-l-primary/60'
                          : 'border-l-2 border-l-transparent hover:bg-surface-container-high hover:border-l-primary/40'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold border-2 transition-all ${isHovered || isSelected ? 'scale-125 ring-1 ring-primary/40' : ''} ${markerColor(marker)}`}>
                        {index + 1}
                      </span>
                      <span className={`material-symbols-outlined text-[12px] flex-shrink-0 transition-colors ${isHovered || isSelected ? 'text-primary/60' : 'text-on-surface-variant/40'}`}>{TYPE_ICON[loc.type]}</span>
                      <p className={`text-[11px] truncate flex-1 transition-colors ${isHovered || isSelected ? 'text-primary font-medium' : 'text-on-surface'}`}>{loc.name}</p>
                    </button>
                  );
                })}

                {/* Locations without marker */}
                {locationsWithoutMarker.length > 0 && (
                  <>
                    {locationsWithMarker.length > 0 && <div className="mx-3 mt-2 mb-1 h-px bg-outline-variant/15" />}
                    {locationsWithoutMarker.map((loc) => {
                      const isQuickTarget = quickLinkLocId === loc.id;
                      return (
                        <div
                          key={loc.id}
                          className={`group/unlinked px-3 py-2 flex items-center gap-2 border-l-2 transition-all duration-150 ${
                            isQuickTarget
                              ? 'border-l-primary bg-primary/8'
                              : 'border-l-transparent hover:bg-surface-container-high/70'
                          }`}
                        >
                          <button
                            onClick={() => {
                              if (isQuickTarget) {
                                setQuickLinkLocId(null);
                                setAddMode(false);
                              } else {
                                setQuickLinkLocId(loc.id);
                                setAddMode(true);
                                setPendingMarker(null);
                                setSelectedMarkerId(null);
                              }
                            }}
                            title={isQuickTarget ? 'Cancel' : 'Place marker on map'}
                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isQuickTarget
                                ? 'bg-primary text-on-primary'
                                : 'opacity-0 group-hover/unlinked:opacity-100 bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[12px]">
                              {isQuickTarget ? 'close' : 'add'}
                            </span>
                          </button>
                          <span className={`material-symbols-outlined text-[12px] flex-shrink-0 transition-colors ${
                            isQuickTarget ? 'text-primary/60' : 'text-on-surface-variant/30'
                          }`}>{TYPE_ICON[loc.type]}</span>
                          <p className={`text-[11px] truncate flex-1 italic transition-colors ${
                            isQuickTarget ? 'text-primary/80' : 'text-on-surface-variant/40'
                          }`}>{loc.name}</p>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Unlinked markers */}
                {unlinkedMarkers.length > 0 && (
                  <>
                    <div className="mx-3 mt-3 mb-1 h-px bg-outline-variant/20" />
                    <p className="px-3 pt-1 pb-1 text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-label flex items-center justify-between">
                      <span>Markers</span>
                      <span className="text-primary font-bold">{unlinkedMarkers.length}</span>
                    </p>
                    {unlinkedMarkers.map((m) => {
                      const index = markers.indexOf(m);
                      const linkedNpc = npcsHere.find((n) => n.id === m.linkedNpcId);
                      const isHovered = hoveredMarkerId === m.id;
                      const isSelected = selectedMarkerId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onMouseEnter={() => setHoveredMarkerId(m.id)}
                          onMouseLeave={() => setHoveredMarkerId(null)}
                          onClick={() => {
                            setSelectedMarkerId((prev) => (prev === m.id ? null : m.id));
                            setPendingMarker(null);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all duration-150 outline-none ${
                            isSelected
                              ? 'bg-primary/15 border-l-2 border-l-primary'
                              : isHovered
                              ? 'bg-surface-container-high border-l-2 border-l-primary/60'
                              : 'border-l-2 border-l-transparent hover:bg-surface-container-high hover:border-l-primary/40'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold border-2 transition-all ${isHovered || isSelected ? 'scale-125 ring-1 ring-primary/40' : ''} ${markerColor(m)}`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] truncate leading-tight transition-colors ${isHovered || isSelected ? 'text-primary font-medium' : 'text-on-surface'}`}>{m.label}</p>
                            {linkedNpc && <p className="text-[9px] text-emerald-400 truncate">{linkedNpc.name}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </>
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
  const [newChildName, setNewChildName] = useState('');
  const [newChildType, setNewChildType] = useState<LocationType>('building');

  const { data: location, isLoading, isError } = useLocation(campaignId ?? '', locationId ?? '');
  const { data: allLocations } = useLocations(campaignId ?? '');
  const { data: allNpcs } = useNpcs(campaignId ?? '');
  const { data: allSessions } = useSessions(campaignId ?? '');
  const saveMutation = useSaveLocation(campaignId ?? '');
  const saveNpc = useSaveNpc();

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
  const childLocations = (allLocations?.filter((l) => l.parentLocationId === location.id) ?? [])
    .sort((a, b) => a.name.localeCompare(b.name));

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

  const handleCreateChildLocation = () => {
    if (!newChildName.trim()) return;
    const now = new Date().toISOString();
    saveMutation.mutate({
      id: `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      campaignId: campaignId ?? '',
      name: newChildName.trim(),
      aliases: [],
      type: newChildType,
      description: '',
      parentLocationId: location.id,
      createdAt: now,
      updatedAt: now,
    } as Location, {
      onSuccess: () => { setAddChildLocOpen(false); setNewChildName(''); setNewChildType('building'); },
    });
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
                <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
                  <span className="material-symbols-outlined text-[14px]">
                    {TYPE_ICON[location.type]}
                  </span>
                  {TYPE_LABEL[location.type]}
                </span>
                {location.settlementType && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-secondary/5 text-secondary text-[10px] font-label tracking-widest uppercase rounded-sm border border-secondary/20">
                    <span className="material-symbols-outlined text-[13px]">
                      {SETTLEMENT_TYPE_ICON[location.settlementType]}
                    </span>
                    {SETTLEMENT_TYPE_LABEL[location.settlementType]}
                  </span>
                )}
                {location.settlementPopulation != null && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">people</span>
                    {location.settlementPopulation.toLocaleString()}
                  </span>
                )}
                {location.climate && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[13px]">
                      {CLIMATE_ICON[location.climate]}
                    </span>
                    {CLIMATE_LABEL[location.climate]}
                  </span>
                )}
              </div>
              <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface leading-tight">
                {location.name}
              </h1>
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
                <button
                  onClick={() => { setAddNpcOpen((v) => !v); setAddNpcSearch(''); }}
                  className="flex items-center gap-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">person_add</span>
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
            <div>
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant whitespace-nowrap">
                    Notable Places
                  </h4>
                  <div className="h-px flex-1 bg-outline-variant/10" />
                  <button
                    onClick={() => { setAddChildLocOpen((v) => !v); setNewChildName(''); }}
                    className="flex items-center gap-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                    Add
                  </button>
                </div>

                {addChildLocOpen && (
                  <div className="mb-3 border border-outline-variant/20 bg-surface-container-low p-3 space-y-2">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Location name…"
                      value={newChildName}
                      onChange={(e) => setNewChildName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateChildLocation();
                        if (e.key === 'Escape') setAddChildLocOpen(false);
                      }}
                      className="w-full bg-surface-container border border-outline-variant/25 focus:border-primary rounded-sm py-2 px-3 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none transition-colors"
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 flex-wrap flex-1">
                        {(['region','settlement','district','building','dungeon'] as LocationType[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => setNewChildType(t)}
                            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-label uppercase tracking-wider rounded-sm transition-all ${
                              newChildType === t
                                ? 'bg-primary text-on-primary'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[11px]">{TYPE_ICON[t]}</span>
                            {TYPE_LABEL[t]}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleCreateChildLocation}
                        disabled={!newChildName.trim() || saveMutation.isPending}
                        className="px-3 py-1.5 bg-primary text-on-primary text-[10px] font-label uppercase tracking-wider rounded-sm disabled:opacity-40 transition-opacity flex-shrink-0"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => setAddChildLocOpen(false)}
                        className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                )}

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
          onCreateChildLocation={(name, type, id) => {
            const now = new Date().toISOString();
            saveMutation.mutate({
              id,
              campaignId: campaignId ?? '',
              name,
              aliases: [],
              type,
              description: '',
              parentLocationId: location.id,
              createdAt: now,
              updatedAt: now,
            } as Location);
          }}
        />
      )}
    </main>
  );
}
