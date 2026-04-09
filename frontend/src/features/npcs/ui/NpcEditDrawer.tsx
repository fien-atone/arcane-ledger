import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveNpc } from '@/features/npcs/api';
import { useSpecies } from '@/features/species/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select, LABEL_CLS, INPUT_CLS, toArray, fromArray, FormDrawer } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { NPC, NpcGender, NpcStatus } from '@/entities/npc';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  npc?: NPC;
}

const STATUS_OPTIONS: NpcStatus[] = ['alive', 'dead', 'missing', 'unknown'];

const GENDER_KEYS: { value: NpcGender; labelKey: string }[] = [
  { value: 'male', labelKey: 'gender_male' },
  { value: 'female', labelKey: 'gender_female' },
  { value: 'nonbinary', labelKey: 'gender_nonbinary' },
];

const now = () => new Date().toISOString();

export function NpcEditDrawer({ open, onClose, campaignId, npc }: Props) {
  const { t } = useTranslation('npcs');
  const save = useSaveNpc();
  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const { data: allSpecies } = useSpecies(campaignId);
  const isEdit = !!npc;

  const genderOptions = useMemo<SelectOption<NpcGender | ''>[]>(
    () => GENDER_KEYS.map((g) => ({ value: g.value, label: t(g.labelKey) })),
    [t],
  );

  const statusOptions = useMemo<SelectOption<NpcStatus>[]>(
    () => STATUS_OPTIONS.map((s) => ({ value: s, label: t(`status_${s}`) })),
    [t],
  );

  const speciesOptions = useMemo<SelectOption<string>[]>(
    () => [...(allSpecies ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map((s) => ({ value: s.id, label: s.name })),
    [allSpecies],
  );

  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [status, setStatus] = useState<NpcStatus>('alive');
  const [speciesId, setSpeciesId] = useState('');
  const [gender, setGender] = useState<NpcGender | ''>('');
  const [age, setAge] = useState('');

  useEffect(() => {
    if (!open) return;
    if (npc) {
      setName(npc.name);
      setAliases(fromArray(npc.aliases));
      setStatus(npc.status);
      setSpeciesId(npc.speciesId ?? '');
      setGender(npc.gender ?? '');
      setAge(npc.age?.toString() ?? '');
    } else {
      setName(''); setAliases(''); setStatus('alive'); setSpeciesId(''); setGender(''); setAge('');
    }
  }, [open, npc]);

  const handleSave = () => {
    if (!name.trim()) return;
    const ts = now();
    const selectedSpecies = allSpecies?.find((s) => s.id === speciesId);
    const record: NPC = {
      id: npc?.id ?? '',
      campaignId,
      name: name.trim(),
      aliases: toArray(aliases),
      status,
      gender: gender || undefined,
      age: age ? parseInt(age, 10) : undefined,
      speciesId: selectedSpecies?.id,
      species: selectedSpecies?.name,
      appearance: npc?.appearance,
      personality: npc?.personality,
      description: npc?.description ?? '',
      motivation: npc?.motivation,
      flaws: npc?.flaws,
      gmNotes: npc?.gmNotes,
      locationPresences: npc?.locationPresences ?? [],
      image: npc?.image,
      groupMemberships: npc?.groupMemberships ?? [],
      relations: npc?.relations ?? [],
      lastSeenLocationId: npc?.lastSeenLocationId,
      createdAt: npc?.createdAt ?? ts,
      updatedAt: ts,
    };
    save.mutate(record, { onSuccess: onClose });
  };

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isEdit ? t('drawer_edit_title') : t('drawer_new_title')}
        subtitle={isEdit ? npc.name : t('drawer_new_subtitle')}
        onClose={onClose}
      />
      <FormDrawer.Body>

          {/* Name */}
          <div>
            <label className={LABEL_CLS}>
              {t('field_name')} <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholder_name')}
              className={INPUT_CLS}
            />
          </div>

          {/* Aliases */}
          <div>
            <label className={LABEL_CLS}>
              {t('field_aliases')}
              <span className="normal-case tracking-normal text-on-surface-variant/40 ml-2 font-normal text-[10px]">
                {t('field_aliases_hint')}
              </span>
            </label>
            <input
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder={t('placeholder_aliases')}
              className={INPUT_CLS}
            />
          </div>

          {/* Status / Gender / Age row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={LABEL_CLS}>{t('field_status')}</label>
              <Select
                value={status}
                options={statusOptions}
                nullable={false}
                onChange={(v) => setStatus(v || 'alive')}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('field_gender')}</label>
              <Select<NpcGender | ''>
                value={gender}
                options={genderOptions}
                placeholder={t('placeholder_gender_none')}
                onChange={(v) => setGender(v ?? '')}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>{t('field_age')}</label>
              <input
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t('placeholder_age_none')}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Species */}
          {speciesEnabled && (
          <div>
            <label className={LABEL_CLS}>{t('field_species')}</label>
            <Select
              value={speciesId}
              options={speciesOptions}
              placeholder={t('placeholder_species_none')}
              searchable
              onChange={(v) => setSpeciesId(v ?? '')}
            />
          </div>
          )}

      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!name.trim()}
        cancelLabel={t('cancel')}
        saveLabel={isEdit ? t('save_changes') : t('create_npc')}
      />
    </FormDrawer>
  );
}
