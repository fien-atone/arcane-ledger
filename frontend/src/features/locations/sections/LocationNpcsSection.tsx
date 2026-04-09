/**
 * LocationNpcsSection — NPCs currently present at this location.
 *
 * Self-contained: fetches the campaign's NPCs and filters those whose
 * `locationPresences` include the current location. Owns the inline
 * picker / remove confirm / presence note edit / visibility toggle state.
 *
 * Gated on the NPCs module being enabled.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useNpcs,
  useSaveNpc,
  useAddNPCLocationPresence,
  useRemoveNPCLocationPresence,
  useSetNPCLocationPresenceVisibility,
} from '@/features/npcs/api/queries';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { SectionPanel, InlineConfirm, useInlineConfirm } from '@/shared/ui';
import type { Location } from '@/entities/location';
import type { NPC } from '@/entities/npc';

interface Props {
  campaignId: string;
  location: Location;
  isGm: boolean;
  enabled: boolean;
  partyEnabled: boolean;
}

export function LocationNpcsSection({ campaignId, location, isGm, enabled, partyEnabled }: Props) {
  const { t } = useTranslation('locations');
  const { data: allNpcs } = useNpcs(campaignId);
  const saveNpc = useSaveNpc();
  const addNpcPresence = useAddNPCLocationPresence();
  const removeNpcPresence = useRemoveNPCLocationPresence();
  const setPresenceVisibility = useSetNPCLocationPresenceVisibility();

  const [addNpcOpen, setAddNpcOpen] = useState(false);
  const [addNpcSearch, setAddNpcSearch] = useState('');
  const confirmRemove = useInlineConfirm<string>();
  const [editingNoteForNpcId, setEditingNoteForNpcId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  if (!enabled) return null;

  const npcsHere = (allNpcs ?? [])
    .filter((npc) => (npc.locationPresences ?? []).some((p) => p.locationId === location.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAddNpc = (npc: NPC) => {
    addNpcPresence.mutate(
      { npcId: npc.id, locationId: location.id },
      { onSuccess: () => { setAddNpcOpen(false); setAddNpcSearch(''); } },
    );
  };

  const handleRemoveNpc = (npc: NPC) => {
    removeNpcPresence.mutate({ npcId: npc.id, locationId: location.id });
  };

  const handleSaveNote = (npc: NPC, note: string) => {
    addNpcPresence.mutate(
      { npcId: npc.id, locationId: location.id, note: note.trim() || undefined },
      { onSuccess: () => setEditingNoteForNpcId(null) },
    );
  };

  return (
    <SectionPanel
      title={t('section_npcs_here')}
      action={isGm ? (
        <button
          onClick={() => { setAddNpcOpen((v) => !v); setAddNpcSearch(''); }}
          className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
        >
          <span className="material-symbols-outlined text-[13px]">person_add</span>
          {t('sessions:add')}
        </button>
      ) : undefined}
    >
      <section className="space-y-4">
        {/* NPC picker */}
        {addNpcOpen && (() => {
          const candidates = (allNpcs ?? []).filter(
            (n) => !npcsHere.find((h) => h.id === n.id),
          );
          const shown = candidates.filter((n) =>
            !addNpcSearch || n.name.toLowerCase().includes(addNpcSearch.toLowerCase()),
          );
          return (
            <div className="border border-outline-variant/20 bg-surface-container-low">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
                <input
                  autoFocus
                  type="text"
                  placeholder={t('search_npcs')}
                  value={addNpcSearch}
                  onChange={(e) => setAddNpcSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {shown.length === 0 ? (
                  <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">{t('no_npcs_found')}</p>
                ) : (
                  shown.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleAddNpc(n)}
                      disabled={saveNpc.isPending}
                      className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-40"
                    >
                      <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">person</span>
                      <span className="text-xs text-on-surface">{n.name}</span>
                      {n.species && <span className="text-[10px] text-on-surface-variant/40">{n.species}</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {npcsHere.length === 0 && !addNpcOpen ? (
          <p className="text-xs text-on-surface-variant/40 italic">
            {t('no_npcs_tagged')}
          </p>
        ) : npcsHere.length > 0 ? (
          <div className="space-y-2">
            {npcsHere.map((npc) => {
              const initials = npc.name
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w[0])
                .join('')
                .toUpperCase();
              const presence = npc.locationPresences?.find((p) => p.locationId === location.id);
              const isEditingNote = editingNoteForNpcId === npc.id;
              return (
                <div key={npc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                  <div className="flex items-stretch">
                    <Link
                      to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                      className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
                    >
                      <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                        {npc.image ? (
                          <img src={resolveImageUrl(npc.image)} alt={npc.name} className="w-full h-full object-cover rounded-sm" />
                        ) : (
                          <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">
                          {npc.name}
                        </p>
                        {npc.species && (
                          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">
                            {npc.species}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </Link>
                    {isGm && (confirmRemove.isAsking(npc.id) ? (
                      <InlineConfirm
                        label={t('confirm_delete')}
                        onYes={() => { handleRemoveNpc(npc); confirmRemove.cancel(); }}
                        onNo={confirmRemove.cancel}
                        yesDisabled={saveNpc.isPending}
                      />
                    ) : (
                      <button
                        onClick={() => confirmRemove.ask(npc.id)}
                        title={t('remove_from_location')}
                        className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                      >
                        <span className="material-symbols-outlined text-[14px]">person_remove</span>
                      </button>
                    ))}
                    {isGm && partyEnabled && presence && (
                      <button
                        onClick={() => setPresenceVisibility.mutate({ npcId: npc.id, locationId: location.id, playerVisible: !presence.playerVisible })}
                        title={presence.playerVisible ? t('visible_click_to_hide') : t('hidden_click_to_show')}
                        className={`flex-shrink-0 px-2 border-l border-outline-variant/10 transition-colors ${
                          presence.playerVisible
                            ? 'text-primary/60 hover:text-primary'
                            : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {presence.playerVisible ? 'visibility' : 'visibility_off'}
                        </span>
                      </button>
                    )}
                  </div>
                  {/* Presence note */}
                  {isGm && isEditingNote ? (
                    <div className="px-3 pb-3 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                      <input
                        autoFocus
                        type="text"
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNote(npc, noteInput);
                          if (e.key === 'Escape') setEditingNoteForNpcId(null);
                        }}
                        placeholder={t('npc_presence_placeholder')}
                        className="flex-1 bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveNote(npc, noteInput)}
                        disabled={saveNpc.isPending}
                        className="px-2 py-1 bg-primary text-on-primary text-[10px] rounded-sm uppercase tracking-wider disabled:opacity-40"
                      >
                        {t('common:save')}
                      </button>
                      <button
                        onClick={() => setEditingNoteForNpcId(null)}
                        className="p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="px-3 pb-2.5 flex items-center gap-1.5">
                      {presence?.note ? (
                        <p className="text-[11px] text-on-surface-variant/60 italic flex-1">{presence.note}</p>
                      ) : isGm ? (
                        <p
                          className="text-[10px] text-on-surface-variant/20 italic flex-1 cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity"
                          onClick={() => { setEditingNoteForNpcId(npc.id); setNoteInput(''); }}
                        >
                          {t('add_presence_note')}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </SectionPanel>
  );
}
