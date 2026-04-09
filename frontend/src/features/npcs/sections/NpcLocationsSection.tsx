/**
 * NPC location presences section — places this NPC has been seen,
 * each with optional note and visibility toggle.
 *
 * Self-contained: fetches its own locations list.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@/features/locations/api';
import {
  useAddNPCLocationPresence,
  useRemoveNPCLocationPresence,
  useSetNPCLocationPresenceVisibility,
} from '@/features/npcs/api/queries';
import { LocationIcon, InlineConfirm } from '@/shared/ui';
import { useLinkedEntityList } from '@/shared/hooks';
import type { NPC, NPCLocationPresence } from '@/entities/npc';

interface Props {
  campaignId: string;
  npc: NPC;
  isGm: boolean;
  enabled: boolean;
  partyEnabled: boolean;
  locationTypesEnabled: boolean;
}

export function NpcLocationsSection({ campaignId, npc, isGm, enabled, partyEnabled, locationTypesEnabled }: Props) {
  const { t } = useTranslation('npcs');
  const { data: allLocations } = useLocations(campaignId);
  const addLocationPresence = useAddNPCLocationPresence();
  const removeLocationPresence = useRemoveNPCLocationPresence();
  const setLocationPresenceVisibility = useSetNPCLocationPresenceVisibility();

  const [editingNoteForLocId, setEditingNoteForLocId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const presences = npc.locationPresences ?? [];
  const picker = useLinkedEntityList<NPCLocationPresence, NonNullable<typeof allLocations>[number]>({
    linked: presences,
    candidates: allLocations ?? [],
    getCandidateId: (l) => l.id,
    getCandidateSearchText: (l) => l.name,
    getLinkedId: (p) => p.locationId,
  });

  if (!enabled) return null;

  const linkedLocations = presences
    .map((p) => allLocations?.find((l) => l.id === p.locationId))
    .filter(Boolean)
    .sort((a, b) => a!.name.localeCompare(b!.name)) as NonNullable<typeof allLocations>[number][];

  const availableToAdd = [...picker.availableFiltered].sort((a, b) => a.name.localeCompare(b.name));

  const handleAddLocation = (locId: string) => {
    addLocationPresence.mutate({ npcId: npc.id, locationId: locId });
    picker.closePicker();
  };

  const handleRemoveLocation = (locId: string) => {
    removeLocationPresence.mutate({ npcId: npc.id, locationId: locId });
    picker.cancelRemove();
  };

  const handleSaveNote = (locId: string, note: string) => {
    addLocationPresence.mutate({ npcId: npc.id, locationId: locId, note: note.trim() || undefined });
    setEditingNoteForLocId(null);
  };

  return (
    <section className="space-y-8 min-w-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
          {t('section_locations')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        {isGm && (
          <button
            onClick={() => (picker.pickerOpen ? picker.closePicker() : picker.openPicker())}
            className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">add_location</span>
            {t('add')}
          </button>
        )}
      </div>

      {picker.pickerOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
            <input
              autoFocus
              type="text"
              value={picker.search}
              onChange={(e) => picker.setSearch(e.target.value)}
              placeholder={t('search_locations')}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableToAdd.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">{t('no_locations_found')}</p>
            ) : availableToAdd.map((l) => (
              <button
                key={l.id}
                onClick={() => handleAddLocation(l.id)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors"
              >
                <LocationIcon locationType={l.type} size="text-[13px]" generic={!locationTypesEnabled} />
                <span className="text-xs text-on-surface">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {linkedLocations.length === 0 && !picker.pickerOpen ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_locations_linked')}</p>
      ) : linkedLocations.length > 0 ? (
        <div className="space-y-2">
          {linkedLocations.map((loc) => {
            const presence = presences.find((p) => p.locationId === loc.id);
            const isEditingNote = editingNoteForLocId === loc.id;
            return (
              <div key={loc.id} className="bg-surface-container-low border border-outline-variant/10 rounded-sm overflow-hidden group/card">
                <div className="flex items-stretch min-w-0">
                  <Link
                    to={`/campaigns/${campaignId}/locations/${loc.id}`}
                    className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
                  >
                    <LocationIcon locationType={loc.type} size="text-[16px]" generic={!locationTypesEnabled} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">
                        {loc.name}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      arrow_forward
                    </span>
                  </Link>
                  {isGm && (picker.isAskingRemove(loc.id) ? (
                    <InlineConfirm
                      label={t('confirm_remove')}
                      onYes={() => handleRemoveLocation(loc.id)}
                      onNo={picker.cancelRemove}
                    />
                  ) : (
                    <button
                      onClick={() => picker.askRemove(loc.id)}
                      title={t('confirm_remove')}
                      className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  ))}
                  {isGm && partyEnabled && (
                    <button
                      onClick={() => setLocationPresenceVisibility.mutate({ npcId: npc.id, locationId: loc.id, playerVisible: !(presence?.playerVisible ?? true) })}
                      title={presence?.playerVisible === false ? t('hidden_click_to_show') : t('visible_click_to_hide')}
                      className={`px-2 border-l border-outline-variant/10 transition-colors ${
                        presence?.playerVisible === false
                          ? 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                          : 'text-primary/60 hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {presence?.playerVisible === false ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  )}
                </div>
                {/* Presence note */}
                {isGm && isEditingNote ? (
                  <div className="px-3 pb-3 flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveNote(loc.id, noteInput);
                        if (e.key === 'Escape') setEditingNoteForLocId(null);
                      }}
                      placeholder="e.g. Frequents the tavern at night\u2026"
                      className="flex-1 bg-surface-container border border-outline-variant/30 focus:border-primary rounded-sm px-2 py-1 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveNote(loc.id, noteInput)}
                      className="px-2 py-1 bg-primary text-on-primary text-[10px] rounded-sm uppercase tracking-wider"
                    >
                      {t('common:save')}
                    </button>
                    <button
                      onClick={() => setEditingNoteForLocId(null)}
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
                        onClick={() => { setEditingNoteForLocId(loc.id); setNoteInput(''); }}
                      >
                        Add presence note\u2026
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
  );
}
