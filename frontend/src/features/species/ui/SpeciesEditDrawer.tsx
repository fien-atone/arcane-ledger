import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveSpecies } from '../api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select } from '@/shared/ui/Select';
import type { SelectOption } from '@/shared/ui/Select';
import { LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
import type { Species, SpeciesSize } from '@/entities/species';

const SIZE_KEYS: { value: SpeciesSize; labelKey: string }[] = [
  { value: 'tiny',       labelKey: 'size_tiny' },
  { value: 'small',      labelKey: 'size_small' },
  { value: 'medium',     labelKey: 'size_medium' },
  { value: 'large',      labelKey: 'size_large' },
  { value: 'huge',       labelKey: 'size_huge' },
  { value: 'gargantuan', labelKey: 'size_gargantuan' },
];

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

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isNew ? t('drawer_new_title') : t('drawer_edit_title')}
        subtitle={!isNew ? species!.name : undefined}
        onClose={onClose}
      />
      <FormDrawer.Body>

          {/* Name + Plural */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLS}>{t('field_name')} <span className="text-primary">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('placeholder_name')}
                className={INPUT_CLS}
                autoFocus
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('field_plural')}</label>
              <input
                type="text"
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
                placeholder={t('placeholder_plural')}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Type + Size */}
          <div className={`grid gap-4 ${typesEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {typesEnabled && (
              <div>
                <label className={LABEL_CLS}>{t('field_type')}</label>
                <Select<string>
                  value={type}
                  options={typeOptions}
                  searchable
                  onChange={(v) => setType(v || 'humanoid')}
                />
              </div>
            )}
            <div>
              <label className={LABEL_CLS}>{t('field_size')}</label>
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
            <label className={LABEL_CLS}>{t('field_traits')}</label>
            <input
              type="text"
              value={traitsRaw}
              onChange={(e) => setTraitsRaw(e.target.value)}
              placeholder={t('placeholder_traits')}
              className={INPUT_CLS}
            />
            <p className="text-[10px] text-on-surface-variant/40 mt-1.5">
              {t('field_traits_hint')}
            </p>
          </div>
      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!name.trim()}
        cancelLabel={t('cancel')}
        saveLabel={isNew ? t('create') : t('save_changes')}
      />
    </FormDrawer>
  );
}
