/**
 * LocationMapViewer — full-screen interactive map viewer/editor.
 *
 * Moved verbatim from the legacy LocationDetailPage. Provides:
 *   - pan + zoom over the location image
 *   - draggable map markers
 *   - "add marker" mode that either auto-links to a known child or hands off
 *     a click point to the parent so it can open an "Add Location" drawer
 *   - sidebar listing both placed markers and unplaced child locations
 *
 * The internal logic is intentionally untouched by the section-widget refactor.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Location, MapMarker } from '@/entities/location';
import {
  CATEGORY_HEX_COLOR,
  CATEGORY_ICON_COLOR,
  CATEGORY_LABEL,
} from '@/entities/locationType';
import type { NPC } from '@/entities/npc';
import { CATEGORY_MARKER_CLS, CATEGORY_ORDER, MARKER_DEFAULT_CLS, type TypeMap } from './constants';

interface MapViewerProps {
  imageUrl: string;
  locationId: string;
  locationName: string;
  initialMarkers: MapMarker[];
  childLocations: Location[];
  npcsHere: NPC[];
  campaignId: string;
  typeMap: TypeMap;
  hideTypes?: boolean;
  onClose: () => void;
  onSave: (markers: MapMarker[]) => void;
  onRequestAddLocation: (point: { x: number; y: number }) => void;
  externalMarkerToAdd?: MapMarker | null;
  onExternalMarkerAdded?: () => void;
}

export function LocationMapViewer({
  imageUrl,
  locationId: _locationId,
  locationName,
  initialMarkers,
  childLocations,
  npcsHere,
  campaignId,
  typeMap,
  hideTypes,
  onClose,
  onSave,
  onRequestAddLocation,
  externalMarkerToAdd,
  onExternalMarkerAdded,
}: MapViewerProps) {
  const { t } = useTranslation('locations');
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
  const [pendingLinkLocId, setPendingLinkLocId] = useState<string | null>(null);

  // Escape cancels add mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddLocMode(false);
        setGhostPos(null);
        setSelectedMarkerId(null);
        setPendingLinkLocId(null);
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
      if (pendingLinkLocId) {
        // Auto-create marker linked to the specific location
        const loc = childLocations.find((l) => l.id === pendingLinkLocId);
        const newMarker: MapMarker = {
          id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          x: coords.x,
          y: coords.y,
          label: loc?.name ?? 'Marker',
          linkedLocationId: pendingLinkLocId,
        };
        const updated = [...markersRef.current, newMarker];
        setMarkers(updated);
        onSave(updated);
        setPendingLinkLocId(null);
      } else {
        onRequestAddLocation(coords);
      }
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
              {t('section_markers')} · {markers.length}
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
            {t('map_add_location')}
          </button>
          <button
            onClick={() => { onSave(markers); onClose(); }}
            className="p-1.5 text-on-surface-variant hover:text-on-surface transition-colors"
            title={t('map_close')}
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
                const te = hideTypes ? undefined : typeMap.get(linkedType);
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
              <span className="text-[10px] font-label uppercase tracking-widest text-primary">{t('map_click_to_place')}</span>
              <span className="text-[10px] text-on-surface-variant/40 ml-1">{t('map_esc_to_cancel')}</span>
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
                  {t('map_delete_marker')}
                </button>
              </div>
            );
          })()}


        {/* Zoom hint */}
        <div className="absolute bottom-4 left-4 text-[10px] text-white/30 pointer-events-none select-none">
          {t('zoom_hint_scroll')} · {t('zoom_hint_drag')}{addLocMode ? ` · ${t('zoom_hint_click')}` : ''} · {Math.round(scale * 100)}%
        </div>
      </div>

      {/* Marker list sidebar */}
      <div className="w-56 flex-shrink-0 bg-surface-container-low border-l border-outline-variant/20 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-outline-variant/20 flex-shrink-0">
          <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/50 font-label flex items-center justify-between">
            <span>{t('section_locations_sidebar')}</span>
            {childLocations.length > 0 && (
              <span>
                <span className="text-on-surface-variant/50">{markers.filter(m => m.linkedLocationId).length} {t('common:of')} </span>
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
              if (hideTypes) return a.name.localeCompare(b.name);
              const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
              const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
              if (catA !== catB) return catA - catB;
              return a.name.localeCompare(b.name);
            });
            for (const loc of sortedLocs) {
              const cat = hideTypes ? '' : (typeMap.get(loc.type)?.category ?? '');
              if (!grouped.has(cat)) grouped.set(cat, []);
              grouped.get(cat)!.push(loc);
            }

            const isEmpty = childLocations.length === 0 && markers.length === 0;
            if (isEmpty) {
              return <p className="text-[10px] text-on-surface-variant/30 italic px-4 pt-4">{t('no_locations_or_markers')}</p>;
            }

            return (
              <div className="py-1">
                {/* Locations grouped by category */}
                {[...grouped.entries()].map(([cat, locs], gi) => (
                  <div key={cat || gi}>
                    {!hideTypes && cat && (
                      <div className="px-3 pt-3 pb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-on-surface-variant/30 flex items-center gap-2">
                        <span>{CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] ?? cat}</span>
                        <div className="flex-1 h-px bg-outline-variant/10" />
                      </div>
                    )}
                    {locs.map((loc) => {
                      const marker = markerByLocId.get(loc.id) ?? null;
                      const te = hideTypes ? undefined : typeMap.get(loc.type);
                      const markerId = marker?.id ?? null;
                      const isHovered = hoveredMarkerId === markerId && markerId !== null;
                      const isSelected = selectedMarkerId === markerId && markerId !== null;
                      if (!marker) {
                        return (
                          <div key={loc.id} className="px-3 py-2.5 flex items-center gap-2.5 border-l-2 border-l-transparent group/unplaced">
                            <span className={`material-symbols-outlined text-[15px] flex-shrink-0 opacity-30`} style={{ fontVariationSettings: "'FILL' 1", color: te ? CATEGORY_HEX_COLOR[te.category] : undefined }}>
                              {te?.icon ?? 'location_on'}
                            </span>
                            <p className="text-[11px] truncate flex-1 text-on-surface-variant/40">{loc.name}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setAddLocMode(true);
                                setPendingLinkLocId(loc.id);
                                setSelectedMarkerId(null);
                              }}
                              title={t('map_place_on_map')}
                              className="opacity-0 group-hover/unplaced:opacity-100 p-1 text-on-surface-variant/30 hover:text-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">add_location_alt</span>
                            </button>
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
                          <span className={`material-symbols-outlined text-[15px] flex-shrink-0 ${
                            te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/40'
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
                      <span>{t('section_markers')}</span>
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
