/**
 * LocationImageSection — image card with optional pin overlay + map viewer.
 *
 * Self-contained: fetches its own locations, NPCs, and location-types so it
 * can render the placeholder pins and feed the full-screen MapViewer when the
 * GM opens the map. Also owns the "Add Location from map" flow:
 *   1. user clicks an unmapped point in the MapViewer
 *   2. MapViewer calls onRequestAddLocation with the click coordinates
 *   3. this section opens a LocationEditDrawer with `initialParentId`
 *   4. on save, it pushes a new marker back into the MapViewer via
 *      `externalMarkerToAdd`, which the viewer appends and persists
 */
import { useMemo, useState } from 'react';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useLocations } from '@/features/locations/api';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocationTypes } from '@/features/locationTypes';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { SectionPanel } from '@/shared/ui';
import type { Location, MapMarker } from '@/entities/location';
import { LocationPlaceholder } from './map/LocationPlaceholder';
import { LocationMapViewer } from './map/LocationMapViewer';
import { CATEGORY_ORDER } from './map/constants';

interface Props {
  campaignId: string;
  location: Location;
  isGm: boolean;
  locationTypesEnabled: boolean;
  imgVersion: number;
  onUploadImage: (file: File) => Promise<void>;
  onSaveMarkers: (markers: MapMarker[]) => void;
}

export function LocationImageSection({
  campaignId,
  location,
  isGm,
  locationTypesEnabled,
  imgVersion,
  onUploadImage,
  onSaveMarkers,
}: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const [mapAddLocPoint, setMapAddLocPoint] = useState<{ x: number; y: number } | null>(null);
  const [mapAddLocDrawerOpen, setMapAddLocDrawerOpen] = useState(false);
  const [mapExternalMarker, setMapExternalMarker] = useState<MapMarker | null>(null);

  const { data: allLocations } = useLocations(campaignId);
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: locationTypes = [] } = useLocationTypes(campaignId);

  const typeMap = useMemo(() => new Map(locationTypes.map((te) => [te.id, te])), [locationTypes]);

  const childLocations = useMemo(
    () =>
      (allLocations?.filter((l) => l.parentLocationId === location.id) ?? []).sort((a, b) => {
        const catA = CATEGORY_ORDER.indexOf(typeMap.get(a.type)?.category ?? '');
        const catB = CATEGORY_ORDER.indexOf(typeMap.get(b.type)?.category ?? '');
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
      }),
    [allLocations, location.id, typeMap],
  );

  const npcsHere = useMemo(
    () =>
      (allNpcs?.filter((npc) =>
        (npc.locationPresences ?? []).some((p) => p.locationId === location.id),
      ) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    [allNpcs, location.id],
  );

  return (
    <>
      <SectionPanel>
        <LocationPlaceholder
          name={location.name}
          imageUrl={resolveImageUrl(location.image, imgVersion)}
          markers={location.mapMarkers}
          childLocations={childLocations}
          typeMap={locationTypesEnabled ? typeMap : undefined}
          onUpload={isGm ? onUploadImage : undefined}
          onOpenMap={() => setMapOpen(true)}
        />
      </SectionPanel>

      {mapOpen && location.image && (
        <LocationMapViewer
          imageUrl={resolveImageUrl(location.image, imgVersion)!}
          locationId={location.id}
          locationName={location.name}
          initialMarkers={location.mapMarkers ?? []}
          childLocations={childLocations}
          npcsHere={npcsHere}
          campaignId={campaignId}
          typeMap={typeMap}
          hideTypes={!locationTypesEnabled}
          onClose={() => setMapOpen(false)}
          onSave={onSaveMarkers}
          onRequestAddLocation={(point) => {
            setMapAddLocPoint(point);
            setMapAddLocDrawerOpen(true);
          }}
          externalMarkerToAdd={mapExternalMarker}
          onExternalMarkerAdded={() => setMapExternalMarker(null)}
        />
      )}

      {/* "Add Location from map" drawer — elevated above the MapViewer */}
      <LocationEditDrawer
        open={mapAddLocDrawerOpen}
        onClose={() => {
          setMapAddLocDrawerOpen(false);
          setMapAddLocPoint(null);
        }}
        campaignId={campaignId}
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
    </>
  );
}
