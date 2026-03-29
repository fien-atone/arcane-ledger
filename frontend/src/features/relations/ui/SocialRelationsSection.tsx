import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRelationsForEntity, useSaveRelation, useDeleteRelation } from '../api';
import { useNpcs } from '@/features/npcs/api/queries';
import { useParty } from '@/features/characters/api/queries';
import { useGroups } from '@/features/groups/api';
import {
  friendlinessLabel,
  friendlinessColor,
  snapFriendliness,
} from '@/entities/relation';
import type { EntityRef, Relation } from '@/entities/relation';

interface Props {
  campaignId: string;
  entityId: string;
}

const SEGMENTS = [
  { threshold: -60, color: '#fb7185' },  // rose-400
  { threshold: -20, color: '#f87171' },  // red-400/lighter rose
  { threshold: 20,  color: '#fbbf24' },  // amber-400
  { threshold: 60,  color: '#6ee7b7' },  // emerald-300
  { threshold: 100, color: '#34d399' },  // emerald-400
];

function FriendlinessBar({ score }: { score: number }) {
  const snapped = snapFriendliness(score);
  const label = friendlinessLabel(snapped);
  const labelColor = friendlinessColor(snapped);
  // Map snapped value to filled segment count: -80→1, -40→2, 0→3, 40→4, 80→5
  const levelToFill: Record<number, number> = { [-80]: 1, [-40]: 2, [0]: 3, [40]: 4, [80]: 5 };
  const filledCount = levelToFill[snapped] ?? 3;
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <div className="flex gap-[2px]">
        {SEGMENTS.map((seg, i) => (
          <div
            key={i}
            className="w-5 h-2 rounded-[1px] transition-all"
            style={{ backgroundColor: i < filledCount ? seg.color : 'rgba(255,255,255,0.06)' }}
          />
        ))}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest w-20 text-right ${labelColor}`}>
        {label}
      </span>
    </div>
  );
}

export function SocialRelationsSection({ campaignId, entityId }: Props) {
  const { data: relations } = useRelationsForEntity(campaignId, entityId);
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: allChars } = useParty(campaignId);
  const { data: allGroups } = useGroups(campaignId);
  const saveRelation = useSaveRelation(campaignId);
  const deleteRelation = useDeleteRelation(campaignId);

  const [addOpen, setAddOpen] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState(0);
  const [editNote, setEditNote] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function resolveName(ref: EntityRef): string {
    if (ref.type === 'npc') return allNpcs?.find((n) => n.id === ref.id)?.name ?? ref.id;
    if (ref.type === 'character') return allChars?.find((c) => c.id === ref.id)?.name ?? ref.id;
    if (ref.type === 'group') return allGroups?.find((g) => g.id === ref.id)?.name ?? ref.id;
    return ref.id;
  }

  function resolveLink(ref: EntityRef): string {
    if (ref.type === 'npc') return `/campaigns/${campaignId}/npcs/${ref.id}`;
    if (ref.type === 'character') return `/campaigns/${campaignId}/characters/${ref.id}`;
    if (ref.type === 'group') return `/campaigns/${campaignId}/groups/${ref.id}`;
    return '#';
  }

  const outgoing = (relations ?? []).filter((r) => r.fromEntity.id === entityId);
  const incoming = (relations ?? []).filter((r) => r.toEntity.id === entityId);

  // NPCs available to add (not already in outgoing)
  const existingTargetIds = new Set(outgoing.map((r) => r.toEntity.id));
  const availableNpcs = (allNpcs ?? [])
    .filter((n) => n.id !== entityId && !existingTargetIds.has(n.id))
    .filter((n) => !addSearch.trim() || n.name.toLowerCase().includes(addSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = (targetId: string) => {
    const now = new Date().toISOString();
    saveRelation.mutate({
      id: '',
      campaignId,
      fromEntity: { type: 'npc', id: entityId },
      toEntity: { type: 'npc', id: targetId },
      friendliness: 0,
      createdAt: now,
      updatedAt: now,
    });
    setAddOpen(false);
    setAddSearch('');
  };

  const handleSaveEdit = (rel: Relation) => {
    saveRelation.mutate({
      ...rel,
      friendliness: editScore,
      note: editNote.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteRelation.mutate(id);
    setConfirmDeleteId(null);
  };

  const startEdit = (rel: Relation) => {
    setEditingId(rel.id);
    setEditScore(snapFriendliness(rel.friendliness));
    setEditNote(rel.note ?? '');
  };

  function renderRow(rel: Relation, target: EntityRef, direction: 'out' | 'in') {
    const name = resolveName(target);
    const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
    const isEditing = editingId === rel.id;

    if (isEditing) {
      return (
        <div key={rel.id} className="p-3 bg-surface-container-low border border-primary/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-on-surface-variant/60">{initials}</span>
            </div>
            <p className="text-xs font-bold text-on-surface flex-1">{name}</p>
          </div>
          <div>
            <label className="block text-[9px] font-label uppercase tracking-widest text-on-surface-variant mb-2">
              Attitude
            </label>
            {(() => {
              const levels = [
                { value: -80, label: 'Hostile',    color: '#fb7185', labelColor: 'text-rose-400' },
                { value: -40, label: 'Unfriendly', color: '#f87171', labelColor: 'text-rose-400/70' },
                { value: 0,   label: 'Neutral',    color: '#fbbf24', labelColor: 'text-amber-400' },
                { value: 40,  label: 'Friendly',   color: '#6ee7b7', labelColor: 'text-emerald-400/70' },
                { value: 80,  label: 'Allied',     color: '#34d399', labelColor: 'text-emerald-400' },
              ];
              const activeIdx = levels.findIndex((l) => l.value === editScore);
              const activeLevel = levels[activeIdx];
              return (
                <div className="space-y-2">
                  {/* Clickable segments bar */}
                  <div className="flex gap-[3px]">
                    {levels.map((level, i) => {
                      const isFilled = i <= activeIdx;
                      return (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setEditScore(level.value)}
                          className="flex-1 h-4 rounded-[2px] transition-all hover:opacity-80"
                          style={{ backgroundColor: isFilled ? level.color : 'rgba(255,255,255,0.06)' }}
                        />
                      );
                    })}
                  </div>
                  {/* Active label */}
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-center ${activeLevel?.labelColor ?? 'text-on-surface-variant/40'}`}>
                    {activeLevel?.label ?? '—'}
                  </p>
                </div>
              );
            })()}
          </div>
          <div>
            <input
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Note (optional)…"
              className="w-full bg-surface-container border border-outline-variant/25 focus:border-primary rounded-sm py-1.5 px-2 text-xs text-on-surface focus:ring-0 focus:outline-none placeholder:text-on-surface-variant/30"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(rel); if (e.key === 'Escape') setEditingId(null); }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditingId(null)} className="px-3 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
            <button onClick={() => handleSaveEdit(rel)} className="px-3 py-1 bg-primary text-on-primary text-[10px] font-label uppercase tracking-wider rounded-sm">Save</button>
          </div>
        </div>
      );
    }

    return (
      <div key={rel.id} className="flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/10 group/rel">
        <Link to={resolveLink(target)} className="flex items-center gap-3 flex-1 min-w-0 group">
          <div className="w-8 h-8 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-on-surface-variant/60">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {target.type === 'character' && <span className="material-symbols-outlined text-[11px] text-secondary/50">shield_person</span>}
              {target.type === 'group' && <span className="material-symbols-outlined text-[11px] text-on-surface-variant/30">groups</span>}
              <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{name}</p>
            </div>
            {rel.note && <p className="text-[10px] text-on-surface-variant/40 italic mt-0.5 truncate">{rel.note}</p>}
          </div>
        </Link>
        <div className="relative flex items-center flex-shrink-0">
          <FriendlinessBar score={rel.friendliness} />
          {direction === 'out' && (
            confirmDeleteId === rel.id ? (
              <div className="absolute inset-0 flex items-center justify-end gap-1 bg-surface-container-low/95 backdrop-blur-sm">
                <span className="text-[9px] text-on-surface-variant">Remove?</span>
                <button onClick={() => handleDelete(rel.id)} className="px-1.5 py-0.5 text-[9px] font-label uppercase text-error">Yes</button>
                <button onClick={() => setConfirmDeleteId(null)} className="px-1.5 py-0.5 text-[9px] font-label uppercase text-on-surface-variant">No</button>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-end gap-0.5 opacity-0 group-hover/rel:opacity-100 transition-opacity bg-surface-container-low/95 backdrop-blur-sm">
                <button onClick={() => startEdit(rel)} title="Edit" className="p-1.5 text-on-surface-variant/40 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button onClick={() => setConfirmDeleteId(rel.id)} title="Remove" className="p-1.5 text-on-surface-variant/40 hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
          Social Relations
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        <button
          onClick={() => { setAddOpen((v) => !v); setAddSearch(''); }}
          className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
        >
          <span className="material-symbols-outlined text-[13px]">person_add</span>
          Add
        </button>
      </div>

      {addOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
            <input
              autoFocus
              type="text"
              placeholder="Search NPCs…"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableNpcs.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">No NPCs found.</p>
            ) : availableNpcs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleAdd(n.id)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">person</span>
                <span className="text-xs text-on-surface">{n.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {outgoing.length === 0 && incoming.length === 0 && !addOpen && (
        <p className="text-xs text-on-surface-variant/40 italic">No social relations.</p>
      )}

      <div className="space-y-6">
        {outgoing.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">
              Their perspective →
            </p>
            {outgoing.map((rel) => renderRow(rel, rel.toEntity, 'out'))}
          </div>
        )}

        {incoming.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">
              ← Others' perspective
            </p>
            {incoming.map((rel) => renderRow(rel, rel.fromEntity, 'in'))}
          </div>
        )}
      </div>
    </section>
  );
}
