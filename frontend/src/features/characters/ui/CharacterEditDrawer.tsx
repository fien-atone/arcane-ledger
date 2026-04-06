import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveCharacter } from '@/features/characters/api/queries';
import { useSpecies } from '@/features/species/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select } from '@/shared/ui';
import type { PlayerCharacter, CharacterGender } from '@/entities/character';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  character?: PlayerCharacter;
  /** Pre-assign to this user on create */
  forUserId?: string;
}

const now = () => new Date().toISOString();

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';


const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

export function CharacterEditDrawer({ open, onClose, campaignId, character, forUserId }: Props) {
  const { t } = useTranslation('party');
  const save = useSaveCharacter();
  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const { data: allSpecies } = useSpecies(campaignId);
  const isNew = !character;

  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [gender, setGender] = useState<CharacterGender | ''>('');
  const [age, setAge] = useState('');
  const [cls, setCls] = useState('');

  useEffect(() => {
    if (!open) return;
    if (character) {
      setName(character.name);
      setSpeciesId(character.speciesId ?? '');
      setGender(character.gender ?? '');
      setAge(character.age?.toString() ?? '');
      setCls(character.class ?? '');
    } else {
      setName(''); setSpeciesId(''); setGender(''); setAge(''); setCls('');
    }
  }, [open, character]);

  const handleSave = () => {
    if (!name.trim()) return;
    const selectedSpecies = allSpecies?.find((s) => s.id === speciesId);
    const ts = now();
    const record: PlayerCharacter = {
      id: character?.id ?? '',
      campaignId,
      userId: character?.userId ?? forUserId,
      image: character?.image,
      gmNotes: character?.gmNotes ?? '',
      groupMemberships: character?.groupMemberships ?? [],
      createdAt: character?.createdAt ?? ts,
      ...(character ?? {}),
      name: name.trim(),
      gender: gender || undefined,
      age: age ? parseInt(age, 10) : undefined,
      species: selectedSpecies?.name,
      speciesId: selectedSpecies?.id,
      class: cls.trim() || undefined,
      updatedAt: ts,
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
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {isNew ? t('drawer_new_subtitle') : character!.name}
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
            <label className={labelCls}>{t('field_name')} <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholder_name')} className={inputCls} autoFocus={isNew} />
          </div>

          {/* Species / Class */}
          <div className={`grid gap-3 ${speciesEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {speciesEnabled && (
            <div>
              <label className={labelCls}>{t('field_species')}</label>
              <Select
                value={speciesId}
                onChange={(v) => setSpeciesId(v)}
                placeholder={t('placeholder_species_none')}
                options={[...(allSpecies ?? [])]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((s) => ({ value: s.id, label: s.name }))}
              />
            </div>
            )}
            <div>
              <label className={labelCls}>{t('field_class')}</label>
              <input type="text" value={cls} onChange={(e) => setCls(e.target.value)}
                placeholder={t('placeholder_class')} className={inputCls} />
            </div>
          </div>

          {/* Gender / Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('field_gender')}</label>
              <Select<CharacterGender>
                value={gender}
                onChange={(v) => setGender(v)}
                placeholder={t('placeholder_gender_none')}
                options={[
                  { value: 'male', label: t('gender_male') },
                  { value: 'female', label: t('gender_female') },
                  { value: 'nonbinary', label: t('gender_nonbinary') },
                ]}
              />
            </div>
            <div>
              <label className={labelCls}>{t('field_age')}</label>
              <input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)}
                placeholder={t('placeholder_age_none')} className={inputCls} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button onClick={onClose} className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleSave} disabled={!name.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            {save.isPending
              ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-sm">save</span>}
            {isNew ? t('create_character_btn') : t('save_changes')}
          </button>
        </div>
      </div>
    </>
  );
}
