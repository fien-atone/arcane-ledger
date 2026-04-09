import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSaveCharacter } from '@/features/characters/api/queries';
import { useSpecies } from '@/features/species/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select, LABEL_CLS, INPUT_CLS, FormDrawer } from '@/shared/ui';
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

  return (
    <FormDrawer open={open} onClose={onClose}>
      <FormDrawer.Header
        title={isNew ? t('drawer_new_title') : t('drawer_edit_title')}
        subtitle={isNew ? t('drawer_new_subtitle') : character!.name}
        onClose={onClose}
      />
      <FormDrawer.Body>

          {/* Name */}
          <div>
            <label className={LABEL_CLS}>{t('field_name')} <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('placeholder_name')} className={INPUT_CLS} autoFocus={isNew} />
          </div>

          {/* Species / Class */}
          <div className={`grid gap-3 ${speciesEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {speciesEnabled && (
            <div>
              <label className={LABEL_CLS}>{t('field_species')}</label>
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
              <label className={LABEL_CLS}>{t('field_class')}</label>
              <input type="text" value={cls} onChange={(e) => setCls(e.target.value)}
                placeholder={t('placeholder_class')} className={INPUT_CLS} />
            </div>
          </div>

          {/* Gender / Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>{t('field_gender')}</label>
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
              <label className={LABEL_CLS}>{t('field_age')}</label>
              <input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value)}
                placeholder={t('placeholder_age_none')} className={INPUT_CLS} />
            </div>
          </div>

      </FormDrawer.Body>
      <FormDrawer.Footer
        onCancel={onClose}
        onSave={handleSave}
        saving={save.isPending}
        saveDisabled={!name.trim()}
        cancelLabel={t('cancel')}
        saveLabel={isNew ? t('create_character_btn') : t('save_changes')}
      />
    </FormDrawer>
  );
}
