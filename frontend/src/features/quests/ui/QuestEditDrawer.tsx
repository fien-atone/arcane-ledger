import { useEffect, useState } from 'react';
import { useSaveQuest } from '@/features/quests/api/queries';
import { useNpcs } from '@/features/npcs/api/queries';
import { Select } from '@/shared/ui';
import type { SelectOption } from '@/shared/ui/Select';
import type { Quest } from '@/entities/quest';

interface Props {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  quest?: Quest;
}

const inputCls =
  'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls =
  'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';

function generateId() {
  return `quest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function QuestEditDrawer({ open, onClose, campaignId, quest }: Props) {
  const save = useSaveQuest(campaignId);
  const { data: allNpcs } = useNpcs(campaignId);
  const isEdit = !!quest;

  const [title, setTitle] = useState('');
  const [giverId, setGiverId] = useState('');

  useEffect(() => {
    if (!open) return;
    if (quest) {
      setTitle(quest.title);
      setGiverId(quest.giverId ?? '');
    } else {
      setTitle('');
      setGiverId('');
    }
  }, [open, quest]);

  const npcOptions: SelectOption<string>[] = (allNpcs ?? [])
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((n) => ({ value: n.id, label: n.name }));

  const handleSave = () => {
    if (!title.trim()) return;
    const record: Quest = {
      id: quest?.id ?? generateId(),
      campaignId,
      title: title.trim(),
      description: quest?.description ?? '',
      giverId: giverId || undefined,
      reward: quest?.reward,
      status: quest?.status ?? 'undiscovered',
      notes: quest?.notes ?? '',
      createdAt: quest?.createdAt ?? new Date().toISOString(),
    };
    save.mutate(record, { onSuccess: onClose });
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {isEdit ? 'Edit Quest' : 'New Quest'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div>
            <label className={labelCls}>Title <span className="text-primary">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quest title…"
              className={inputCls}
              autoFocus
            />
          </div>

          <div>
            <label className={labelCls}>Quest Giver</label>
            <Select<string>
              value={giverId}
              options={npcOptions}
              onChange={(v) => setGiverId(v || '')}
              placeholder="Select NPC…"
              nullable
              searchable
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:border-primary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || save.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </>
  );
}
