import { useEffect, useRef, useState } from 'react';
import { useSaveLocation } from '@/features/locations/api/queries';
import { Select } from '@/shared/ui/Select';
import type { SelectOption } from '@/shared/ui/Select';
import type { Location, LocationType, SettlementType, Climate } from '@/entities/location';

const LOCATION_TYPE_OPTIONS: SelectOption<LocationType>[] = [
  { value: 'region',     label: 'Region' },
  { value: 'settlement', label: 'Settlement' },
  { value: 'district',   label: 'District' },
  { value: 'building',   label: 'Building' },
  { value: 'dungeon',    label: 'Dungeon' },
];

const SETTLEMENT_TYPE_OPTIONS: SelectOption<SettlementType>[] = [
  { value: 'village',    label: 'Village' },
  { value: 'town',       label: 'Town' },
  { value: 'city',       label: 'City' },
  { value: 'metropolis', label: 'Metropolis' },
];

const SETTLEMENT_DEFAULT_POPULATION: Record<SettlementType, number> = {
  village: 400,
  town: 3000,
  city: 12000,
  metropolis: 75000,
};

const CLIMATE_OPTIONS: SelectOption<Climate>[] = [
  { value: 'arctic',      label: 'Arctic' },
  { value: 'subarctic',   label: 'Subarctic' },
  { value: 'temperate',   label: 'Temperate' },
  { value: 'continental', label: 'Continental' },
  { value: 'maritime',    label: 'Maritime' },
  { value: 'subtropical', label: 'Subtropical' },
  { value: 'tropical',    label: 'Tropical' },
  { value: 'arid',        label: 'Arid (Desert)' },
  { value: 'semi-arid',   label: 'Semi-Arid' },
  { value: 'highland',    label: 'Highland' },
];

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const textareaCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30 resize-none';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

interface Props {
  open: boolean;
  onClose: () => void;
  location: Location;
}

export function LocationEditDrawer({ open, onClose, location }: Props) {
  const save = useSaveLocation(location.campaignId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('building');
  const [settlementType, setSettlementType] = useState<SettlementType | ''>('');
  const [settlementPopulation, setSettlementPopulation] = useState('');
  const [climate, setClimate] = useState<Climate | ''>('');
  const [description, setDescription] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    setName(location.name);
    setType(location.type);
    setSettlementType(location.settlementType ?? '');
    setSettlementPopulation(location.settlementPopulation?.toString() ?? '');
    setClimate(location.climate ?? '');
    setDescription(location.description);
    setGmNotes(location.gmNotes ?? '');
    setImage(location.image);
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
    const record: Location = {
      ...location,
      name: name.trim(),
      type,
      settlementType: type === 'settlement' && settlementType ? settlementType : undefined,
      settlementPopulation: type === 'settlement' && !isNaN(pop) && pop > 0 ? pop : undefined,
      climate: type === 'region' && climate ? climate : undefined,
      description: description.trim(),
      gmNotes: gmNotes.trim() || undefined,
      image,
    };
    save.mutate(record, { onSuccess: onClose });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">Edit Location</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {location.name}
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
              options={LOCATION_TYPE_OPTIONS}
              nullable={false}
              onChange={(v) => setType((v || 'building') as LocationType)}
            />
          </div>

          {/* Settlement fields — type + population side by side */}
          {type === 'settlement' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Settlement Type</label>
                <Select
                  value={settlementType}
                  options={SETTLEMENT_TYPE_OPTIONS}
                  placeholder="— not set —"
                  onChange={(val) => {
                    const prevDefault = settlementType ? SETTLEMENT_DEFAULT_POPULATION[settlementType as SettlementType] : null;
                    const isDefaultOrEmpty = !settlementPopulation || (prevDefault !== null && settlementPopulation === String(prevDefault));
                    setSettlementType(val);
                    if (val && isDefaultOrEmpty) {
                      setSettlementPopulation(String(SETTLEMENT_DEFAULT_POPULATION[val as SettlementType]));
                    }
                  }}
                />
              </div>
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
            </div>
          )}

          {/* Climate (only for region) */}
          {type === 'region' && (
            <div>
              <label className={labelCls}>Climate</label>
              <Select
                value={climate}
                options={CLIMATE_OPTIONS}
                placeholder="— not set —"
                onChange={setClimate}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Describe this location…"
              className={textareaCls}
            />
          </div>

          {/* GM Notes */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
            <div className="pl-4">
              <label className="block text-[10px] font-label uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                GM Notes
              </label>
              <textarea
                value={gmNotes}
                onChange={(e) => setGmNotes(e.target.value)}
                rows={3}
                placeholder="Private notes — not visible to players…"
                className={`${textareaCls} border-primary/20 focus:border-primary`}
              />
            </div>
          </div>

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
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
