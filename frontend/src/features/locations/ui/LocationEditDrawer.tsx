import { useEffect, useRef, useState, useMemo } from 'react';
import { useSaveLocation, useLocations } from '@/features/locations/api/queries';
import { useLocationTypes, useContainmentRules } from '@/features/locationTypes';
import { Select } from '@/shared/ui/Select';
import type { SelectOption } from '@/shared/ui/Select';
import type { Location, LocationType } from '@/entities/location';
import { CATEGORY_ICON_COLOR, CATEGORY_LABEL } from '@/entities/locationType';

function biomeLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

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

function generateId() {
  return `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function LocationEditDrawer({ open, onClose, campaignId, location, initialParentId, onSaved, elevated }: Props) {
  const save = useSaveLocation(campaignId);
  const { data: locationTypes = [] } = useLocationTypes(campaignId);
  const { data: containmentRules = [] } = useContainmentRules();
  const { data: allLocations = [] } = useLocations(campaignId);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [image, setImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    if (location) {
      setName(location.name);
      setType(location.type);
      setParentLocationId(location.parentLocationId ?? '');
      setSettlementPopulation(location.settlementPopulation?.toString() ?? '');
      setBiome(location.biome ?? '');
      setImage(location.image);
    } else {
      setName(''); setType(locationTypes[0]?.id ?? 'building');
      setParentLocationId(initialParentId ?? ''); setSettlementPopulation(''); setBiome('');
      setImage(undefined);
    }
  }, [open, location]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const pop = parseInt(settlementPopulation, 10);
    const ts = new Date().toISOString();
    const record: Location = {
      id: location?.id ?? generateId(),
      campaignId,
      aliases: location?.aliases ?? [],
      createdAt: location?.createdAt ?? ts,
      ...(location ?? {}),
      name: name.trim(),
      type,
      parentLocationId: parentLocationId || undefined,
      settlementPopulation: selectedTypeEntry?.isSettlement && !isNaN(pop) && pop > 0 ? pop : undefined,
      biome: biomeOptions.length > 0 && biome ? biome : undefined,
      description: location?.description ?? '',
      image,
    };
    save.mutate(record, { onSuccess: () => { onSaved?.(record); onClose(); } });
  };

  if (!open) return null;

  return (
    <>
      <div className={`fixed inset-0 ${elevated ? 'z-[110]' : 'z-60'} bg-black/50 backdrop-blur-sm`} onClick={onClose} />
      <div className={`fixed inset-y-0 right-0 ${elevated ? 'z-[120]' : 'z-70'} w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20`}>

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isNew ? 'New Location' : 'Edit Location'}
            </h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {isNew ? 'Add a location to the world' : location!.name}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Name */}
          <div>
            <label className={labelCls}>Name <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>

          {/* Location Type */}
          <div>
            <label className={labelCls}>Type</label>
            <Select
              value={type}
              options={locationTypeOptions}
              nullable={false}
              searchable
              onChange={(v) => { setType(v || (locationTypes[0]?.id ?? 'building')); setParentLocationId(initialParentId ?? ''); }}
            />
          </div>

          {/* Parent location */}
          {parentOptions.length > 0 && (
            <div>
              <label className={labelCls}>Part of</label>
              <Select
                value={parentLocationId}
                options={parentOptions}
                placeholder="— none —"
                onChange={setParentLocationId}
              />
            </div>
          )}

          {/* Population — only for settlement types */}
          {selectedTypeEntry?.isSettlement && (
            <div>
              <label className={labelCls}>Population</label>
              <input
                type="number"
                min={0}
                value={settlementPopulation}
                onChange={(e) => setSettlementPopulation(e.target.value)}
                placeholder="e.g. 12 000"
                className={inputCls}
              />
            </div>
          )}

          {/* Biome / terrain sub-type */}
          {biomeOptions.length > 0 && (
            <div>
              <label className={labelCls}>Terrain</label>
              <Select
                value={biome}
                options={biomeOptions}
                placeholder="— not set —"
                onChange={setBiome}
              />
            </div>
          )}

          {/* Map / Image */}
          <div>
            <label className={labelCls}>Map / Image</label>
            {image && (
              <div className="mb-3 relative">
                <img
                  src={image}
                  alt="Location preview"
                  className="w-full aspect-video object-cover rounded-sm border border-outline-variant/20"
                />
                <button
                  onClick={() => setImage(undefined)}
                  className="absolute top-2 right-2 p-1 bg-surface/80 rounded-sm text-on-surface-variant hover:text-error transition-colors"
                  title="Remove image"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/60 text-xs font-label uppercase tracking-widest rounded-sm transition-colors w-full justify-center"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              {image ? 'Replace Image' : 'Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button onClick={onClose} className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {save.isPending ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">save</span>
            )}
            {isNew ? 'Create Location' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
