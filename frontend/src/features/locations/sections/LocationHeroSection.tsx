/**
 * Location hero header — type/biome/population pills, title, and edit/delete
 * actions. Owns the LocationEditDrawer state and the inline delete-confirm
 * flow. Fetches location types itself so the parent doesn't have to thread
 * the type map.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocationEditDrawer } from '@/features/locations/ui';
import { useLocationTypes } from '@/features/locationTypes';
import { CATEGORY_BADGE_CLS } from '@/entities/locationType';
import type { Location } from '@/entities/location';

interface Props {
  campaignId: string;
  location: Location;
  isGm: boolean;
  locationTypesEnabled: boolean;
  onDelete: () => void;
}

export function LocationHeroSection({
  campaignId,
  location,
  isGm,
  locationTypesEnabled,
  onDelete,
}: Props) {
  const { t } = useTranslation('locations');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const typeMap = useMemo(() => new Map(locationTypes.map((te) => [te.id, te])), [locationTypes]);
  const te = typeMap.get(location.type);

  return (
    <>
      <section className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8 mb-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {locationTypesEnabled && (
              <span
                className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-label tracking-widest uppercase rounded-sm border ${
                  te
                    ? CATEGORY_BADGE_CLS[te.category]
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/10'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {te?.icon ?? 'location_on'}
                </span>
                {te?.name ?? location.type}
              </span>
            )}
            {location.settlementPopulation != null && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/20">
                <span className="material-symbols-outlined text-[13px]">people</span>
                {location.settlementPopulation.toLocaleString()}
              </span>
            )}
            {locationTypesEnabled && location.biome && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/20">
                <span className="material-symbols-outlined text-[13px]">terrain</span>
                {location.biome.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            )}
          </div>
          <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface leading-tight">
            {location.name}
          </h1>
        </div>
        {isGm && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            {confirmDelete ? (
              <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                <span className="text-[9px] text-on-surface-variant">{t('confirm_delete')}</span>
                <button
                  onClick={onDelete}
                  className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                >
                  {t('confirm_yes')}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {t('confirm_no')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {t('edit')}
            </button>
          </div>
        )}
      </section>

      <LocationEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId}
        location={location}
      />
    </>
  );
}
