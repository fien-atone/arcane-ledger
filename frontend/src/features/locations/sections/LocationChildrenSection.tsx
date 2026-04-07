/**
 * LocationChildrenSection — "Notable Places" list of child locations.
 *
 * Self-contained: fetches its own locations + location-types so it can render
 * each child's icon and per-row visibility toggle. Owns the
 * LocationEditDrawer state for adding a new child (pre-filled with this
 * location as parent).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations, useSetLocationVisibility } from '@/features/locations/api';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useLocationTypes } from '@/features/locationTypes';
import { CATEGORY_HEX_COLOR } from '@/entities/locationType';
import type { Location } from '@/entities/location';
import { CATEGORY_ORDER } from './map/constants';

interface Props {
  campaignId: string;
  location: Location;
  isGm: boolean;
  partyEnabled: boolean;
  locationTypesEnabled: boolean;
}

export function LocationChildrenSection({
  campaignId,
  location,
  isGm,
  partyEnabled,
  locationTypesEnabled,
}: Props) {
  const { t } = useTranslation('locations');
  const [addChildLocOpen, setAddChildLocOpen] = useState(false);

  const { data: allLocations } = useLocations(campaignId);
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const setLocationVisibility = useSetLocationVisibility();

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

  return (
    <>
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
        <div className="flex items-center gap-3 mb-3 min-w-0">
          <h4 className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
            {t('section_notable_places')}
          </h4>
          <div className="h-px flex-1 bg-outline-variant/10" />
          {isGm && (
            <button
              onClick={() => setAddChildLocOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
            >
              <span className="material-symbols-outlined text-[13px]">add_location_alt</span>
              {t('sessions:add')}
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {childLocations.length === 0 && (
            <p className="text-xs text-on-surface-variant/40 italic py-2">{t('no_notable_places')}</p>
          )}
          {childLocations.map((child) => {
            const hasMarker = (location.mapMarkers ?? []).some((mk) => mk.linkedLocationId === child.id);
            const te = locationTypesEnabled ? typeMap.get(child.type) : undefined;
            return (
              <div
                key={child.id}
                className="flex items-stretch bg-surface-container-low border border-outline-variant/10 rounded-sm"
              >
                <Link
                  to={`/campaigns/${campaignId}/locations/${child.id}`}
                  className="group flex items-center gap-2.5 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] ${te ? '' : 'text-on-surface-variant/40'}`}
                    style={te ? { color: CATEGORY_HEX_COLOR[te.category] } : undefined}
                  >
                    {te?.icon ?? 'location_on'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">
                      {child.name}
                    </p>
                    {locationTypesEnabled && (
                      <p className="text-[9px] uppercase tracking-wider text-on-surface-variant/40">
                        {te?.name ?? child.type}
                      </p>
                    )}
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
                {isGm && partyEnabled && (
                  <button
                    onClick={() =>
                      setLocationVisibility.mutate({
                        campaignId,
                        id: child.id,
                        playerVisible: !(child as any).playerVisible,
                        playerVisibleFields: (child as any).playerVisibleFields ?? [],
                      })
                    }
                    title={
                      (child as any).playerVisible
                        ? t('visible_click_to_hide')
                        : t('hidden_click_to_show')
                    }
                    className={`flex-shrink-0 px-2 border-l border-outline-variant/10 transition-colors ${
                      (child as any).playerVisible
                        ? 'text-primary/60 hover:text-primary'
                        : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {(child as any).playerVisible ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <LocationEditDrawer
        open={addChildLocOpen}
        onClose={() => setAddChildLocOpen(false)}
        campaignId={campaignId}
        initialParentId={location.id}
      />
    </>
  );
}
