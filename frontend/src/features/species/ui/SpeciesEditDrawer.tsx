import { useEffect, useState } from 'react';
import { useSaveSpecies } from '../api';
import { Select } from '@/shared/ui/Select';
import { RichTextEditor } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { Species, SpeciesType, SpeciesSize } from '@/entities/species';

const TYPE_OPTIONS: SelectOption<SpeciesType>[] = [
  { value: 'humanoid',    label: 'Humanoid' },
  { value: 'beast',       label: 'Beast' },
  { value: 'undead',      label: 'Undead' },
  { value: 'construct',   label: 'Construct' },
  { value: 'fey',         label: 'Fey' },
  { value: 'fiend',       label: 'Fiend' },
  { value: 'celestial',   label: 'Celestial' },
  { value: 'dragon',      label: 'Dragon' },
  { value: 'elemental',   label: 'Elemental' },
  { value: 'giant',       label: 'Giant' },
  { value: 'monstrosity', label: 'Monstrosity' },
  { value: 'plant',       label: 'Plant' },
  { value: 'ooze',        label: 'Ooze' },
  { value: 'aberration',  label: 'Aberration' },
];

const SIZE_OPTIONS: SelectOption<SpeciesSize>[] = [
  { value: 'tiny',       label: 'Tiny' },
  { value: 'small',      label: 'Small' },
  { value: 'medium',     label: 'Medium' },
  { value: 'large',      label: 'Large' },
  { value: 'huge',       label: 'Huge' },
  { value: 'gargantuan', label: 'Gargantuan' },
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
  /** Pass existing species to edit, undefined to create new */
  species?: Species;
}

function newId() {
  return `species-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function SpeciesEditDrawer({ open, onClose, species }: Props) {
  const save = useSaveSpecies();
  const isNew = !species;

  const [name, setName] = useState('');
  const [pluralName, setPluralName] = useState('');
  const [type, setType] = useState<SpeciesType>('humanoid');
  const [size, setSize] = useState<SpeciesSize>('medium');
  const [description, setDescription] = useState('');
  const [traitsRaw, setTraitsRaw] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(species?.name ?? '');
    setPluralName(species?.pluralName ?? '');
    setType(species?.type ?? 'humanoid');
    setSize(species?.size ?? 'medium');
    setDescription(species?.description ?? '');
    setTraitsRaw(species?.traits?.join(', ') ?? '');
  }, [open, species]);

  const handleSave = () => {
    if (!name.trim()) return;
    const traits = traitsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const record: Species = {
      id: species?.id ?? newId(),
      name: name.trim(),
      pluralName: pluralName.trim() || undefined,
      type,
      size,
      description: description.trim() || undefined,
      traits: traits.length > 0 ? traits : undefined,
      image: species?.image,
      createdAt: species?.createdAt ?? new Date().toISOString(),
    };
    save.mutate(record, { onSuccess: onClose });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isNew ? 'New Species' : 'Edit Species'}
            </h2>
            {!isNew && (
              <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                {species!.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Name + Plural */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name <span className="text-primary">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Human"
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>Plural</label>
              <input
                type="text"
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
                placeholder="Humans"
                className={inputCls}
              />
            </div>
          </div>

          {/* Type + Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <Select
                value={type}
                options={TYPE_OPTIONS}
                nullable={false}
                onChange={(v) => setType((v || 'humanoid') as SpeciesType)}
              />
            </div>
            <div>
              <label className={labelCls}>Size</label>
              <Select
                value={size}
                options={SIZE_OPTIONS}
                nullable={false}
                onChange={(v) => setSize((v || 'medium') as SpeciesSize)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <RichTextEditor value={description} onChange={setDescription} placeholder="Describe this species…" minHeight="7rem" />
          </div>

          {/* Traits */}
          <div>
            <label className={labelCls}>Traits</label>
            <input
              type="text"
              value={traitsRaw}
              onChange={(e) => setTraitsRaw(e.target.value)}
              placeholder="Darkvision, Lucky, Brave…"
              className={inputCls}
            />
            <p className="text-[10px] text-on-surface-variant/40 mt-1.5">
              Comma-separated
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
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
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}
