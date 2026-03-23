import { useEffect, useState } from 'react';
import { useSaveCharacter } from '@/features/characters/api/queries';
import { useSpecies } from '@/features/species/api';
import type { PlayerCharacter, CharacterGender } from '@/entities/character';

interface Props {
  open: boolean;
  onClose: () => void;
  character: PlayerCharacter;
}

const now = () => new Date().toISOString();

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const textareaCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30 resize-none';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

export function CharacterEditDrawer({ open, onClose, character }: Props) {
  const save = useSaveCharacter();
  const { data: allSpecies } = useSpecies();

  const [name, setName] = useState('');
  const [speciesId, setSpeciesId] = useState('');
  const [gender, setGender] = useState<CharacterGender | ''>('');
  const [age, setAge] = useState('');
  const [cls, setCls] = useState('');
  const [appearance, setAppearance] = useState('');
  const [background, setBackground] = useState('');
  const [personality, setPersonality] = useState('');
  const [motivation, setMotivation] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [gmNotes, setGmNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(character.name);
    setSpeciesId(character.speciesId ?? '');
    setGender(character.gender ?? '');
    setAge(character.age?.toString() ?? '');
    setCls(character.class ?? '');
    setAppearance(character.appearance ?? '');
    setBackground(character.background ?? '');
    setPersonality(character.personality ?? '');
    setMotivation(character.motivation ?? '');
    setBonds(character.bonds ?? '');
    setFlaws(character.flaws ?? '');
    setGmNotes(character.gmNotes ?? '');
  }, [open, character]);

  const handleSave = () => {
    if (!name.trim()) return;
    const selectedSpecies = allSpecies?.find((s) => s.id === speciesId);
    const record: PlayerCharacter = {
      ...character,
      name: name.trim(),
      gender: gender || undefined,
      age: age ? parseInt(age, 10) : undefined,
      species: selectedSpecies?.name,
      speciesId: selectedSpecies?.id,
      class: cls.trim() || undefined,
      appearance: appearance.trim() || undefined,
      background: background.trim() || undefined,
      personality: personality.trim() || undefined,
      motivation: motivation.trim() || undefined,
      bonds: bonds.trim() || undefined,
      flaws: flaws.trim() || undefined,
      gmNotes: gmNotes.trim(),
      updatedAt: now(),
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
            <h2 className="font-headline text-xl font-bold text-on-surface">Edit Character</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {character.name}
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

          {/* Gender / Age / Species / Class */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Gender</label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as CharacterGender | '')}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="nonbinary">Non-binary</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-[18px]">unfold_more</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Age</label>
              <input
                type="number"
                min={0}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="—"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Species</label>
              <div className="relative">
                <select
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  <option value="">— None —</option>
                  {(allSpecies ?? []).sort((a, b) => a.name.localeCompare(b.name)).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-[18px]">unfold_more</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Class</label>
              <input type="text" value={cls} onChange={(e) => setCls(e.target.value)} placeholder="Wizard…" className={inputCls} />
            </div>
          </div>

          {/* Appearance */}
          <div>
            <label className={labelCls}>Appearance</label>
            <textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} rows={3} placeholder="Physical description…" className={textareaCls} />
          </div>

          {/* Background */}
          <div>
            <label className={labelCls}>Backstory</label>
            <textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={4} placeholder="History, origin, key events…" className={textareaCls} />
          </div>

          {/* Personality */}
          <div>
            <label className={labelCls}>Personality Traits</label>
            <textarea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={3} placeholder="Quirks, habits, mannerisms…" className={textareaCls} />
          </div>

          {/* Motivation */}
          <div>
            <label className={labelCls}>Motivation & Ideals</label>
            <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} rows={3} placeholder="What drives them, what they believe in…" className={textareaCls} />
          </div>

          {/* Bonds */}
          <div>
            <label className={labelCls}>Bonds</label>
            <textarea value={bonds} onChange={(e) => setBonds(e.target.value)} rows={2} placeholder="People, places, or things they care about…" className={textareaCls} />
          </div>

          {/* Flaws */}
          <div>
            <label className={labelCls}>Flaws</label>
            <textarea value={flaws} onChange={(e) => setFlaws(e.target.value)} rows={2} placeholder="Weaknesses, vices, fears…" className={textareaCls} />
          </div>

          {/* GM Notes */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
            <div className="pl-4">
              <label className="block text-[10px] font-label uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                GM Notes
              </label>
              <textarea value={gmNotes} onChange={(e) => setGmNotes(e.target.value)} rows={3} placeholder="Private notes — not visible to players…" className={`${textareaCls} border-primary/20 focus:border-primary`} />
            </div>
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
