import { useEffect, useState } from 'react';
import { useSaveNpc } from '@/features/npcs/api';
import { useSpecies } from '@/features/species/api';
import type { NPC, NpcGender, NpcStatus } from '@/entities/npc';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  npc?: NPC;
}

const STATUS_OPTIONS: NpcStatus[] = ['alive', 'dead', 'missing', 'unknown', 'hostile'];

function generateId() {
  return `npc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const now = () => new Date().toISOString();

function toArray(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
function fromArray(arr: string[]): string {
  return arr.join(', ');
}

// ── Shared input classes ──────────────────────────────────────────────────────
const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const textareaCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30 resize-none';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

// ─────────────────────────────────────────────────────────────────────────────

export function NpcEditDrawer({ open, onClose, campaignId, npc }: Props) {
  const save = useSaveNpc();
  const { data: allSpecies } = useSpecies();
  const isEdit = !!npc;

  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [status, setStatus] = useState<NpcStatus>('alive');
  const [speciesId, setSpeciesId] = useState('');
  const [gender, setGender] = useState<NpcGender | ''>('');
  const [age, setAge] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [description, setDescription] = useState('');
  const [motivation, setMotivation] = useState('');
  const [flaws, setFlaws] = useState('');
  const [gmNotes, setGmNotes] = useState('');
  const [locations, setLocations] = useState('');

  useEffect(() => {
    if (!open) return;
    if (npc) {
      setName(npc.name);
      setAliases(fromArray(npc.aliases));
      setStatus(npc.status);
      setSpeciesId(npc.speciesId ?? '');
      setGender(npc.gender ?? '');
      setAge(npc.age?.toString() ?? '');
      setAppearance(npc.appearance ?? '');
      setPersonality(npc.personality ?? '');
      setDescription(npc.description);
      setMotivation(npc.motivation ?? '');
      setFlaws(npc.flaws ?? '');
      setGmNotes(npc.gmNotes ?? '');
      setLocations(fromArray(npc.locations));
    } else {
      setName(''); setAliases(''); setStatus('alive'); setSpeciesId(''); setGender(''); setAge('');
      setAppearance(''); setPersonality(''); setDescription('');
      setMotivation(''); setFlaws(''); setGmNotes(''); setLocations('');
    }
  }, [open, npc]);

  const handleSave = () => {
    if (!name.trim()) return;
    const ts = now();
    const selectedSpecies = allSpecies?.find((s) => s.id === speciesId);
    const record: NPC = {
      id: npc?.id ?? generateId(),
      campaignId,
      name: name.trim(),
      aliases: toArray(aliases),
      status,
      gender: gender || undefined,
      age: age ? parseInt(age, 10) : undefined,
      speciesId: selectedSpecies?.id,
      species: selectedSpecies?.name,
      appearance: appearance.trim() || undefined,
      personality: personality.trim() || undefined,
      description: description.trim(),
      motivation: motivation.trim() || undefined,
      flaws: flaws.trim() || undefined,
      gmNotes: gmNotes.trim() || undefined,
      locations: toArray(locations),
      image: npc?.image,
      groupMemberships: npc?.groupMemberships ?? [],
      relations: npc?.relations ?? [],
      lastSeenLocationId: npc?.lastSeenLocationId,
      createdAt: npc?.createdAt ?? ts,
      updatedAt: ts,
    };
    save.mutate(record, { onSuccess: onClose });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isEdit ? 'Edit NPC' : 'New NPC'}
            </h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {isEdit ? npc.name : 'Create a new character record'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Name */}
          <div>
            <label className={labelCls}>
              Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Character name…"
              className={inputCls}
            />
          </div>

          {/* Aliases */}
          <div>
            <label className={labelCls}>
              Aliases
              <span className="normal-case tracking-normal text-on-surface-variant/40 ml-2 font-normal text-[10px]">
                comma-separated
              </span>
            </label>
            <input
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Alias one, Alias two…"
              className={inputCls}
            />
          </div>

          {/* Status / Gender / Age / Species row */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as NpcStatus)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-[18px]">unfold_more</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as NpcGender | '')}
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
          </div>

          {/* Appearance */}
          <div>
            <label className={labelCls}>Appearance</label>
            <textarea
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              rows={3}
              placeholder="Physical description…"
              className={textareaCls}
            />
          </div>

          {/* Personality */}
          <div>
            <label className={labelCls}>Personality</label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              rows={3}
              placeholder="Traits, mannerisms, motivation…"
              className={textareaCls}
            />
          </div>

          {/* Motivation */}
          <div>
            <label className={labelCls}>Motivation & Ideals</label>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows={2}
              placeholder="What drives them, what they believe in…"
              className={textareaCls}
            />
          </div>

          {/* Flaws */}
          <div>
            <label className={labelCls}>Flaws</label>
            <textarea
              value={flaws}
              onChange={(e) => setFlaws(e.target.value)}
              rows={2}
              placeholder="Weaknesses, vices, fears…"
              className={textareaCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Background / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="History, role, key facts…"
              className={textareaCls}
            />
          </div>

          {/* Locations */}
          <div>
            <label className={labelCls}>
              Known Locations
              <span className="normal-case tracking-normal text-on-surface-variant/40 ml-2 font-normal text-[10px]">
                comma-separated
              </span>
            </label>
            <input
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="Emberwood Village, Bent Row…"
              className={inputCls}
            />
          </div>

          {/* GM Notes */}
          <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
              <div className="pl-4">
                <label className="block text-[10px] font-label uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1.5">
                  <span
                    className="material-symbols-outlined text-[13px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    lock
                  </span>
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
            {isEdit ? 'Save Changes' : 'Create NPC'}
          </button>
        </div>
      </div>
    </>
  );
}
