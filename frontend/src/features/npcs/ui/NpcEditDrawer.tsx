import { useEffect, useMemo, useState } from 'react';
import { useSaveNpc } from '@/features/npcs/api';
import { useSpecies } from '@/features/species/api';
import { useSectionEnabled } from '@/features/campaigns/api/queries';
import { Select } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { NPC, NpcGender, NpcStatus } from '@/entities/npc';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  npc?: NPC;
}

const STATUS_OPTIONS: NpcStatus[] = ['alive', 'dead', 'missing', 'unknown'];

const GENDER_OPTIONS: SelectOption<NpcGender | ''>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
];

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

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

// ─────────────────────────────────────────────────────────────────────────────

export function NpcEditDrawer({ open, onClose, campaignId, npc }: Props) {
  const save = useSaveNpc();
  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const { data: allSpecies } = useSpecies(campaignId);
  const isEdit = !!npc;

  const statusOptions = useMemo<SelectOption<NpcStatus>[]>(
    () => STATUS_OPTIONS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })),
    [],
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

          {/* Status / Gender / Age row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <Select
                value={status}
                options={statusOptions}
                nullable={false}
                onChange={(v) => setStatus(v || 'alive')}
              />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <Select<NpcGender | ''>
                value={gender}
                options={GENDER_OPTIONS}
                placeholder="—"
                onChange={(v) => setGender(v ?? '')}
              />
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
          </div>

          {/* Species */}
          {speciesEnabled && (
          <div>
            <label className={labelCls}>Species</label>
            <Select
              value={speciesId}
              options={speciesOptions}
              placeholder="— None —"
              searchable
              onChange={(v) => setSpeciesId(v ?? '')}
            />
          </div>
          )}

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
