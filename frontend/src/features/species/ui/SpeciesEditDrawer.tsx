import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveSpecies } from '../api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select } from '@/shared/ui/Select';
import type { SelectOption } from '@/shared/ui/Select';
import type { Species, SpeciesSize } from '@/entities/species';

const SIZE_KEYS: { value: SpeciesSize; labelKey: string }[] = [
  { value: 'tiny',       labelKey: 'size_tiny' },
  { value: 'small',      labelKey: 'size_small' },
  { value: 'medium',     labelKey: 'size_medium' },
  { value: 'large',      labelKey: 'size_large' },
  { value: 'huge',       labelKey: 'size_huge' },
  { value: 'gargantuan', labelKey: 'size_gargantuan' },
];

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  species?: Species;
}


export function SpeciesEditDrawer({ open, onClose, campaignId, species }: Props) {
  const { t } = useTranslation('species');
  const save = useSaveSpecies(campaignId);
  const typesEnabled = useSectionEnabled(campaignId, 'species_types');
  const { data: speciesTypes } = useSpeciesTypes(campaignId);
  const isNew = !species;

  const sizeOptions = useMemo<SelectOption<SpeciesSize>[]>(
    () => SIZE_KEYS.map((s) => ({ value: s.value, label: t(s.labelKey) })),
    [t],
  );

  const typeOptions = useMemo<SelectOption<string>[]>(
    () => (speciesTypes ?? []).map((st) => ({ value: st.id, label: st.name, icon: st.icon })),
    [speciesTypes],
  );

  const [name, setName] = useState('');
  const [pluralName, setPluralName] = useState('');
  const [type, setType] = useState<string>('humanoid');
  const [size, setSize] = useState<SpeciesSize>('medium');
  const [traitsRaw, setTraitsRaw] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(species?.name ?? '');
    setPluralName(species?.pluralName ?? '');
    setType(species?.type ?? 'humanoid');
    setSize(species?.size ?? 'medium');
    setTraitsRaw(species?.traits?.join(', ') ?? '');
  }, [open, species]);

  const handleSave = () => {
    if (!name.trim()) return;
    const traits = traitsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const record: Species = {
      id: species?.id ?? '',
      campaignId,
      name: name.trim(),
      pluralName: pluralName.trim() || undefined,
      type,
      size,
      description: species?.description,
      traits: traits.length > 0 ? traits : undefined,
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
              {isNew ? t('drawer_new_title') : t('drawer_edit_title')}
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
              <label className={labelCls}>{t('field_name')} <span className="text-primary">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('placeholder_name')}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className={labelCls}>{t('field_plural')}</label>
              <input
                type="text"
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
                placeholder={t('placeholder_plural')}
                className={inputCls}
              />
            </div>
          </div>

          {/* Type + Size */}
          <div className={`grid gap-4 ${typesEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {typesEnabled && (
              <div>
                <label className={labelCls}>{t('field_type')}</label>
                <Select<string>
                  value={type}
                  options={typeOptions}
                  searchable
                  onChange={(v) => setType(v || 'humanoid')}
                />
              </div>
            )}
            <div>
              <label className={labelCls}>{t('field_size')}</label>
              <Select
                value={size}
                options={sizeOptions}
                nullable={false}
                onChange={(v) => setSize((v || 'medium') as SpeciesSize)}
              />
            </div>
          </div>

          {/* Traits */}
          <div>
            <label className={labelCls}>{t('field_traits')}</label>
            <input
              type="text"
              value={traitsRaw}
              onChange={(e) => setTraitsRaw(e.target.value)}
              placeholder={t('placeholder_traits')}
              className={inputCls}
            />
            <p className="text-[10px] text-on-surface-variant/40 mt-1.5">
              {t('field_traits_hint')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {t('cancel')}
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
            {isNew ? t('create') : t('save_changes')}
          </button>
        </div>
      </div>
    </>
  );
}
