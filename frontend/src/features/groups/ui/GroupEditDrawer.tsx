import { useEffect, useState } from 'react';
import { useSaveGroup } from '@/features/groups/api';
import type { Group, GroupType } from '@/entities/group';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  group?: Group;
}

const GROUP_TYPES: { value: GroupType; label: string }[] = [
  { value: 'faction', label: 'Faction' },
  { value: 'guild', label: 'Guild' },
  { value: 'family', label: 'Family' },
  { value: 'religion', label: 'Religion' },
  { value: 'criminal', label: 'Criminal Organization' },
  { value: 'military', label: 'Military / Order' },
  { value: 'academy', label: 'Academy / School' },
  { value: 'secret', label: 'Secret Society' },
];

const RELATION_OPTIONS = ['allied', 'neutral', 'hostile', 'unknown'];

function generateId() {
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const now = () => new Date().toISOString();

function toArray(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
function fromArray(arr: string[]): string {
  return arr.join(', ');
}

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';

const textareaCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30 resize-none';

const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

export function GroupEditDrawer({ open, onClose, campaignId, group }: Props) {
  const save = useSaveGroup();
  const isEdit = !!group;

  const [name, setName] = useState('');
  const [type, setType] = useState<GroupType>('faction');
  const [aliases, setAliases] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState('');
  const [symbols, setSymbols] = useState('');
  const [partyRelation, setPartyRelation] = useState('neutral');
  const [gmNotes, setGmNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (group) {
      setName(group.name);
      setType(group.type);
      setAliases(fromArray(group.aliases));
      setDescription(group.description);
      setGoals(group.goals ?? '');
      setSymbols(group.symbols ?? '');
      setPartyRelation(group.partyRelation ?? 'neutral');
      setGmNotes(group.gmNotes ?? '');
    } else {
      setName(''); setType('faction'); setAliases(''); setDescription('');
      setGoals(''); setSymbols(''); setPartyRelation('neutral'); setGmNotes('');
    }
  }, [open, group]);

  const handleSave = () => {
    if (!name.trim()) return;
    const ts = now();
    const record: Group = {
      id: group?.id ?? generateId(),
      campaignId,
      name: name.trim(),
      type,
      aliases: toArray(aliases),
      description: description.trim(),
      goals: goals.trim() || undefined,
      symbols: symbols.trim() || undefined,
      partyRelation: partyRelation || undefined,
      gmNotes: gmNotes.trim() || undefined,
      createdAt: group?.createdAt ?? ts,
      updatedAt: ts,
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
            <h2 className="font-headline text-xl font-bold text-on-surface">
              {isEdit ? 'Edit Group' : 'New Group'}
            </h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">
              {isEdit ? group.name : 'Add a social group to this campaign'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Name */}
          <div>
            <label className={labelCls}>Name <span className="text-primary">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Group name…" className={inputCls} />
          </div>

          {/* Type + Party Relation row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <div className="relative">
                <select value={type} onChange={(e) => setType(e.target.value as GroupType)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                  {GROUP_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-[18px]">
                  unfold_more
                </span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Party Relation</label>
              <div className="relative">
                <select value={partyRelation} onChange={(e) => setPartyRelation(e.target.value)}
                  className={`${inputCls} appearance-none pr-8 cursor-pointer`}>
                  {RELATION_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-[18px]">
                  unfold_more
                </span>
              </div>
            </div>
          </div>

          {/* Aliases */}
          <div>
            <label className={labelCls}>
              Aliases
              <span className="normal-case tracking-normal text-on-surface-variant/40 ml-2 font-normal text-[10px]">comma-separated</span>
            </label>
            <input type="text" value={aliases} onChange={(e) => setAliases(e.target.value)}
              placeholder="Alias one, Alias two…" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={4} placeholder="Who they are, what they do…" className={textareaCls} />
          </div>

          {/* Goals */}
          <div>
            <label className={labelCls}>Goals</label>
            <textarea value={goals} onChange={(e) => setGoals(e.target.value)}
              rows={3} placeholder="Objectives and motivations…" className={textareaCls} />
          </div>

          {/* Symbols */}
          <div>
            <label className={labelCls}>Symbols & Insignia</label>
            <input type="text" value={symbols} onChange={(e) => setSymbols(e.target.value)}
              placeholder="Colors, emblems, marks…" className={inputCls} />
          </div>

          {/* GM Notes */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40" />
            <div className="pl-4">
              <label className="block text-[10px] font-label uppercase tracking-widest text-primary mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                GM Notes
              </label>
              <textarea value={gmNotes} onChange={(e) => setGmNotes(e.target.value)}
                rows={3} placeholder="Private notes — not visible to players…"
                className={`${textareaCls} border-primary/20 focus:border-primary`} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button onClick={onClose}
            className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!name.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
            {save.isPending
              ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-sm">save</span>}
            {isEdit ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </div>
    </>
  );
}
