import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveLocation, useLocations } from '@/features/locations/api/queries';
import { useLocationTypes, useContainmentRules } from '@/features/locationTypes';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select } from '@/shared/ui/Select';
import type { SelectOption } from '@/shared/ui/Select';
import { LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import type { Location, LocationType } from '@/entities/location';
import { CATEGORY_ICON_COLOR, CATEGORY_LABEL } from '@/entities/locationType';

function biomeLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  location?: Location;
  initialParentId?: string;
  onSaved?: (location: Location) => void;
  /** When true, uses z-[110]/z-[120] to render above z-[100] overlays like MapViewer */
  elevated?: boolean;
}

export function LocationEditDrawer({ open, onClose, campaignId, location, initialParentId, onSaved, elevated }: Props) {
  const { t } = useTranslation('locations');
  const save = useSaveLocation(campaignId);
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const { data: containmentRules = [] } = useContainmentRules();
  const { data: allLocations = [] } = useLocations(campaignId);
  const isNew = !location;

  const locationTypeOptions = useMemo<SelectOption<string>[]>(
    () => locationTypes.map((t) => ({
      value: t.id,
      label: t.name,
      icon: t.icon,
      iconColor: CATEGORY_ICON_COLOR[t.category],
      group: CATEGORY_LABEL[t.category],
    })),
    [locationTypes],
  );

  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('building');
  const [parentLocationId, setParentLocationId] = useState('');

  const selectedTypeEntry = locationTypes.find((t) => t.id === type);
  const biomeOptions = useMemo<SelectOption<string>[]>(
    () => (selectedTypeEntry?.biomeOptions ?? []).map((v) => ({ value: v, label: biomeLabel(v) })),
    [selectedTypeEntry],
  );

  const validParentTypeIds = useMemo(
    () => new Set(containmentRules.filter((r) => r.childTypeId === type).map((r) => r.parentTypeId)),
    [containmentRules, type],
  );

  const parentOptions = useMemo<SelectOption<string>[]>(
    () => allLocations
      .filter((l) => validParentTypeIds.has(l.type) && l.id !== location?.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((l) => ({ value: l.id, label: l.name })),
    [allLocations, validParentTypeIds, location?.id],
  );

  const [settlementPopulation, setSettlementPopulation] = useState('');
  const [biome, setBiome] = useState('');


  useEffect(() => {
    if (!open) return;
    if (location) {
      setName(location.name);
      setType(location.type);
      setParentLocationId(location.parentLocationId ?? '');
      setSettlementPopulation(location.settlementPopulation?.toString() ?? '');
      setBiome(location.biome ?? '');
    } else {
      setName(''); setType(locationTypes[0]?.id ?? 'building');
      setParentLocationId(initialParentId ?? ''); setSettlementPopulation(''); setBiome('');
    }
  }, [open, location]);

  const handleSave = () => {
    if (!name.trim()) return;
    const pop = parseInt(settlementPopulation, 10);
    const ts = new Date().toISOString();
    const record: Location = {
      id: location?.id ?? '',
      campaignId,
      createdAt: location?.createdAt ?? ts,
      ...(location ?? {}),
      name: name.trim(),
      type: locationTypesEnabled ? type : (location?.type ?? ''),
      parentLocationId: parentLocationId || undefined,
      settlementPopulation: selectedTypeEntry?.isSettlement && !isNaN(pop) && pop > 0 ? pop : undefined,
      biome: biomeOptions.length > 0 && biome ? biome : undefined,
      description: location?.description ?? '',
    };
    save.mutate(record, { onSuccess: (saved) => { onSaved?.(saved); onClose(); } });
  };

  return (
    <FormDrawer open={open} onClose={onClose} elevated={elevated}>
      <FormDrawer.Header
        title={isNew ? t('drawer_new_title') : t('drawer_edit_title')}
        subtitle={isNew ? t('drawer_new_subtitle') : location!.name}
        onClose={onClose}
      />
      <FormDrawer.Body>

          {/* Name */}
          <div>
            <label className={LABEL_CLS}>{t('field_name')} <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLS} />
          </div>

          {/* Location Type */}
          {locationTypesEnabled && (
            <div>
              <label className={LABEL_CLS}>{t('field_type')}</label>
              <Select
                value={type}
                options={locationTypeOptions}
                nullable={false}
                searchable
                onChange={(v) => { setType(v || (locationTypes[0]?.id ?? 'building')); setParentLocationId(initialParentId ?? ''); }}
              />
            </div>
          )}

          {/* Parent location — hidden when creating from map (auto-assigned) */}
          {locationTypesEnabled && !initialParentId && parentOptions.length > 0 && (
            <div>
              <label className={LABEL_CLS}>{t('field_part_of')}</label>
              <Select
                value={parentLocationId}
                options={parentOptions}
                placeholder={t('placeholder_part_of_none')}
                onChange={setParentLocationId}
              />
            </div>
          )}

          {/* Population — only for settlement types */}
          {locationTypesEnabled && selectedTypeEntry?.isSettlement && (
            <div>
              <label className={LABEL_CLS}>{t('field_population')}</label>
              <input
                type="number"
                min={0}
                value={settlementPopulation}
                onChange={(e) => setSettlementPopulation(e.target.value)}
                placeholder={t('placeholder_population')}
                className={INPUT_CLS}
              />
            </div>
          )}

          {/* Biome / terrain sub-type */}
          {locationTypesEnabled && biomeOptions.length > 0 && (
            <div>
              <label className={LABEL_CLS}>{t('field_terrain')}</label>
              <Select
                value={biome}
                options={biomeOptions}
                placeholder={t('placeholder_terrain_none')}
                onChange={setBiome}
              />
            </div>
          )}

          {/* Image upload is available on the location detail page after creation */}
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!name.trim()}
        cancelLabel={t('cancel')}
        saveLabel={isNew ? t('create_location') : t('save_changes')}
      />
    </FormDrawer>
  );
}
