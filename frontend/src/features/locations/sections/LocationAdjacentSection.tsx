/**
 * LocationAdjacentSection — links to adjacent / reachable locations.
 *
 * Self-contained: fetches its own locations list and resolves
 * `location.adjacentLocationIds` against it. Renders nothing when there are
 * no adjacent locations, matching the original page behavior.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@/features/locations/api';
import { useLocationTypes } from '@/features/locationTypes';
import { CATEGORY_HEX_COLOR } from '@/entities/locationType';
import type { Location } from '@/entities/location';

interface Props {
  campaignId: string;
  location: Location;
  locationTypesEnabled: boolean;
}

export function LocationAdjacentSection({ campaignId, location, locationTypesEnabled }: Props) {
  const { t } = useTranslation('locations');
  const { data: allLocations } = useLocations(campaignId);
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const typeMap = useMemo(() => new Map(locationTypes.map((te) => [te.id, te])), [locationTypes]);

  const adjacentLocations =
    location.adjacentLocationIds && location.adjacentLocationIds.length > 0
      ? (allLocations ?? []).filter((l) => location.adjacentLocationIds!.includes(l.id))
      : [];

  if (adjacentLocations.length === 0) return null;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <section className="space-y-4">
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
            {t('adjacent_reachable')}
          </h2>
          <div className="h-px flex-1 bg-outline-variant/20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {adjacentLocations.map((adj) => {
            const te = locationTypesEnabled ? typeMap.get(adj.type) : undefined;
            return (
              <Link
                key={adj.id}
                to={`/campaigns/${campaignId}/locations/${adj.id}`}
                className="group flex items-center gap-3 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all min-w-0"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${te ? '' : 'text-on-surface-variant/40'}`}
                  style={te ? { color: CATEGORY_HEX_COLOR[te.category] } : undefined}
                >
                  {te?.icon ?? 'location_on'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-headline text-on-surface group-hover:text-secondary transition-colors truncate">
                    {adj.name}
                  </p>
                  {locationTypesEnabled && (
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                      {te?.name ?? adj.type}
                    </p>
                  )}
                </div>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-secondary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  arrow_forward
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
