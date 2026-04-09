/**
 * LocationMiniMapSection — small zoomed preview of THIS location's marker
 * on its parent's map. Renders only when:
 *   - the location has a parent,
 *   - the parent has an image, AND
 *   - the parent has a marker that links back to this location.
 *
 * Self-contained: fetches its own locations + location-types.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@/features/locations/api';
import { useLocationTypes } from '@/features/locationTypes';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { CATEGORY_ICON_COLOR } from '@/entities/locationType';
import { SectionPanel } from '@/shared/ui';
import type { Location } from '@/entities/location';
import { MiniMapPreview } from './map/MiniMapPreview';
import { CATEGORY_MARKER_CLS, MARKER_DEFAULT_CLS } from './map/constants';

interface Props {
  campaignId: string;
  location: Location;
  locationTypesEnabled: boolean;
}

export function LocationMiniMapSection({ campaignId, location, locationTypesEnabled }: Props) {
  const { t } = useTranslation('locations');
  const { data: allLocations } = useLocations(campaignId);
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const typeMap = useMemo(() => new Map(locationTypes.map((te) => [te.id, te])), [locationTypes]);

  const parentLocation = location.parentLocationId
    ? allLocations?.find((l) => l.id === location.parentLocationId)
    : undefined;
  const parentMarker = parentLocation?.mapMarkers?.find((m) => m.linkedLocationId === location.id);

  if (!parentLocation || !parentLocation.image || !parentMarker) return null;

  const ownTe = locationTypesEnabled ? typeMap.get(location.type) : undefined;
  const markerIcon = ownTe?.icon ?? 'location_on';
  const markerIconColor = ownTe ? CATEGORY_ICON_COLOR[ownTe.category] : 'text-primary';
  const markerBubbleCls = ownTe
    ? (CATEGORY_MARKER_CLS[ownTe.category]?.bubble ?? MARKER_DEFAULT_CLS.bubble)
    : MARKER_DEFAULT_CLS.bubble;

  return (
    <SectionPanel>
      <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[13px] text-primary">my_location</span>
        {t('section_on_map_of', { name: parentLocation.name })}
      </h4>
      <Link
        to={`/campaigns/${campaignId}/locations/${parentLocation.id}`}
        className="block relative group/minimap rounded-sm overflow-hidden"
      >
        <MiniMapPreview
          imageUrl={resolveImageUrl(parentLocation.image)!}
          markerX={parentMarker.x}
          markerY={parentMarker.y}
          markerLabel={parentMarker.label}
          markerIcon={markerIcon}
          markerIconColor={markerIconColor}
          markerBubbleCls={markerBubbleCls}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-end justify-end p-2.5 opacity-0 group-hover/minimap:opacity-100 transition-opacity pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface/90 backdrop-blur-sm border border-outline-variant/30 rounded-sm text-[10px] font-label uppercase tracking-widest text-primary">
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            {t('open_parent', { name: parentLocation.name })}
          </div>
        </div>
      </Link>
    </SectionPanel>
  );
}
