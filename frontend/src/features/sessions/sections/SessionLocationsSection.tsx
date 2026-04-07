/**
 * SessionLocationsSection — list of locations visited in this session.
 *
 * Same shape as SessionNpcsSection: GM-only add picker, inline-confirm
 * remove, and (when the party module is on) per-row visibility toggle.
 *
 * Fetches its own location list. The `locationTypesEnabled` flag toggles
 * generic vs. type-specific icons via the shared `LocationIcon` widget.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocations, useSetLocationVisibility } from '@/features/locations/api';
import { useSaveSession } from '@/features/sessions/api/queries';
import { LocationIcon } from '@/shared/ui';
import type { Session } from '@/entities/session';

interface Props {
  campaignId: string;
  session: Session;
  isGm: boolean;
  partyEnabled: boolean;
  locationTypesEnabled: boolean;
}

export function SessionLocationsSection({
  campaignId,
  session,
  isGm,
  partyEnabled,
  locationTypesEnabled,
}: Props) {
  const { t } = useTranslation('sessions');
  const { data: allLocations } = useLocations(campaignId);
  const saveSession = useSaveSession(campaignId);
  const setLocationVisibility = useSetLocationVisibility();

  const [locSearch, setLocSearch] = useState('');
  const [locSearchOpen, setLocSearchOpen] = useState(false);
  const [confirmRemoveLocId, setConfirmRemoveLocId] = useState<string | null>(null);

  const locationIds = session.locationIds ?? [];
  const linked = [...(session.locations ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const available = (allLocations ?? [])
    .filter((l) => !locationIds.includes(l.id))
    .filter((l) => !locSearch.trim() || l.name.toLowerCase().includes(locSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addLoc = async (id: string) => {
    await saveSession.mutate({ ...session, locationIds: [...locationIds, id] }, { only: 'locationIds' });
    setLocSearchOpen(false);
    setLocSearch('');
  };
  const removeLoc = async (id: string) => {
    await saveSession.mutate({ ...session, locationIds: locationIds.filter((x) => x !== id) }, { only: 'locationIds' });
    setConfirmRemoveLocId(null);
  };

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
          {t('section_locations')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        {isGm && (
          <button
            onClick={() => { setLocSearchOpen((v) => !v); setLocSearch(''); }}
            className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">add_location</span>
            {t('add')}
          </button>
        )}
      </div>

      {isGm && locSearchOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
            <input autoFocus type="text" placeholder={t('search_locations')}
              value={locSearch} onChange={(e) => setLocSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">{t('no_locations_found')}</p>
            ) : available.map((l) => (
              <button key={l.id} onClick={() => addLoc(l.id)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors">
                <LocationIcon locationType={l.type} size="text-[13px]" generic={!locationTypesEnabled} />
                <span className="text-xs text-on-surface">{l.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {linked.length === 0 && !locSearchOpen ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_locations_tagged')}</p>
      ) : linked.length > 0 ? (
        <div className="space-y-2">
          {linked.map((loc) => (
            <div key={loc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
              <div className="flex items-stretch">
                <Link to={`/campaigns/${campaignId}/locations/${loc.id}`}
                  className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0">
                  <LocationIcon locationType={loc.type ?? ''} size="text-[16px]" generic={!locationTypesEnabled} />
                  <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate flex-1">{loc.name}</p>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </Link>
                {isGm && partyEnabled && (
                  <button
                    onClick={() => setLocationVisibility.mutate({
                      campaignId,
                      id: loc.id,
                      playerVisible: !loc.playerVisible,
                      playerVisibleFields: loc.playerVisibleFields ?? [],
                    })}
                    title={loc.playerVisible ? t('common:visible_click_to_hide') : t('common:hidden_click_to_show')}
                    className={`flex-shrink-0 px-2 border-l border-outline-variant/10 transition-colors ${
                      loc.playerVisible
                        ? 'text-primary/60 hover:text-primary'
                        : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {loc.playerVisible ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                )}
                {isGm && (confirmRemoveLocId === loc.id ? (
                  <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5">
                    <span className="text-[10px] text-on-surface-variant">{t('confirm_remove')}</span>
                    <button onClick={() => removeLoc(loc.id)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">{t('confirm_yes')}</button>
                    <button onClick={() => setConfirmRemoveLocId(null)} className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">{t('confirm_no')}</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmRemoveLocId(loc.id)} title={t('remove_from_session')}
                    className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
