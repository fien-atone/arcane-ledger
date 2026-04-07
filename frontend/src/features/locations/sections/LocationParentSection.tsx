/**
 * LocationParentSection — link card to the location's parent (the location
 * this one is "part of"). Renders nothing when there is no parent.
 *
 * Self-contained: fetches its own locations + location-types so it can show
 * the parent's icon, name and type label.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@/features/locations/api';
import { useLocationTypes } from '@/features/locationTypes';
import { CATEGORY_ICON_COLOR, CATEGORY_TILE_CLS } from '@/entities/locationType';
import type { Location } from '@/entities/location';

interface Props {
  campaignId: string;
  location: Location;
  locationTypesEnabled: boolean;
}

export function LocationParentSection({ campaignId, location, locationTypesEnabled }: Props) {
  const { t } = useTranslation('locations');
  const { data: allLocations } = useLocations(campaignId);
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const typeMap = useMemo(() => new Map(locationTypes.map((te) => [te.id, te])), [locationTypes]);

  const parentLocation = location.parentLocationId
    ? allLocations?.find((l) => l.id === location.parentLocationId)
    : undefined;

  if (!parentLocation) return null;

  const te = locationTypesEnabled ? typeMap.get(parentLocation.type) : undefined;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-3">
        {t('section_part_of')}
      </h4>
      <Link
        to={`/campaigns/${campaignId}/locations/${parentLocation.id}`}
        className="group flex items-center gap-3 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all rounded-sm"
      >
        <span
          className={`w-10 h-10 rounded-sm flex items-center justify-center border flex-shrink-0 transition-all ${
            te ? CATEGORY_TILE_CLS[te.category] : 'bg-surface-container-highest border-outline-variant/20'
          }`}
        >
          <span
            className={`material-symbols-outlined text-[18px] ${
              te ? CATEGORY_ICON_COLOR[te.category] : 'text-on-surface-variant/40'
            }`}
          >
            {te?.icon ?? 'location_on'}
          </span>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-headline text-on-surface group-hover:text-primary transition-colors truncate">
            {parentLocation.name}
          </p>
          {locationTypesEnabled && (
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
              {te?.name ?? parentLocation.type}
            </p>
          )}
        </div>
        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
          arrow_forward
        </span>
      </Link>
    </div>
  );
}
