/**
 * SessionNpcsSection — list of NPCs that appear in this session.
 *
 * GM can add NPCs from a searchable picker, remove with inline confirm, and
 * (if the party module is on) toggle each NPC's player visibility from this
 * row. The section fetches its own NPC list via `useNpcs`; it never receives
 * bulk NPC data through props.
 *
 * Add/remove writes the new `npcIds` back through `useSaveSession` with the
 * `only: 'npcIds'` partial-update flag so other session fields stay intact.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNpcs, useSetNpcVisibility } from '@/features/npcs/api/queries';
import { useSaveSession } from '@/features/sessions/api/queries';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import { SectionPanel, InlineConfirm, useInlineConfirm } from '@/shared/ui';
import type { Session } from '@/entities/session';

interface Props {
  campaignId: string;
  session: Session;
  isGm: boolean;
  partyEnabled: boolean;
}

export function SessionNpcsSection({ campaignId, session, isGm, partyEnabled }: Props) {
  const { t } = useTranslation('sessions');
  const { data: allNpcs } = useNpcs(campaignId);
  const saveSession = useSaveSession(campaignId);
  const setNpcVisibility = useSetNpcVisibility();

  const [npcSearch, setNpcSearch] = useState('');
  const [npcSearchOpen, setNpcSearchOpen] = useState(false);
  const confirmRemove = useInlineConfirm<string>();

  const npcIds = session.npcIds ?? [];
  const linked = [...(session.npcs ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const available = (allNpcs ?? [])
    .filter((n) => !npcIds.includes(n.id))
    .filter((n) => !npcSearch.trim() || n.name.toLowerCase().includes(npcSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addNpc = async (id: string) => {
    await saveSession.mutate({ ...session, npcIds: [...npcIds, id] }, { only: 'npcIds' });
    setNpcSearchOpen(false);
    setNpcSearch('');
  };
  const removeNpc = async (id: string) => {
    await saveSession.mutate({ ...session, npcIds: npcIds.filter((x) => x !== id) }, { only: 'npcIds' });
    confirmRemove.cancel();
  };

  return (
    <SectionPanel
      title={t('section_npcs')}
      action={isGm ? (
        <button
          onClick={() => { setNpcSearchOpen((v) => !v); setNpcSearch(''); }}
          className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
        >
          <span className="material-symbols-outlined text-[13px]">person_add</span>
          {t('add')}
        </button>
      ) : undefined}
    >
      {isGm && npcSearchOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
            <input
              autoFocus type="text" placeholder={t('search_npcs')}
              value={npcSearch} onChange={(e) => setNpcSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">{t('no_npcs_found')}</p>
            ) : available.map((n) => (
              <button key={n.id} onClick={() => addNpc(n.id)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[13px] text-on-surface-variant/40">person</span>
                <span className="text-xs text-on-surface">{n.name}</span>
                {n.species && <span className="text-[10px] text-on-surface-variant/40">{n.species}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {linked.length === 0 && !npcSearchOpen ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_npcs_tagged')}</p>
      ) : linked.length > 0 ? (
        <div className="space-y-2">
          {linked.map((npc) => {
            const initials = npc.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
            return (
              <div key={npc.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
                <div className="flex items-stretch">
                  <Link to={`/campaigns/${campaignId}/npcs/${npc.id}`}
                    className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
                      {npc.image ? (
                        <img src={resolveImageUrl(npc.image)} alt={npc.name} className="w-full h-full object-cover rounded-sm" />
                      ) : (
                        <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">{npc.name}</p>
                      {npc.species && <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40">{npc.species}</p>}
                    </div>
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                  </Link>
                  {isGm && partyEnabled && (
                    <button
                      onClick={() => setNpcVisibility.mutate({
                        campaignId,
                        id: npc.id,
                        playerVisible: !npc.playerVisible,
                        playerVisibleFields: npc.playerVisibleFields ?? [],
                      })}
                      title={npc.playerVisible ? t('common:visible_click_to_hide') : t('common:hidden_click_to_show')}
                      className={`flex-shrink-0 px-2 border-l border-outline-variant/10 transition-colors ${
                        npc.playerVisible
                          ? 'text-primary/60 hover:text-primary'
                          : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {npc.playerVisible ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  )}
                  {isGm && (confirmRemove.isAsking(npc.id) ? (
                    <InlineConfirm
                      label={t('confirm_remove')}
                      onYes={() => removeNpc(npc.id)}
                      onNo={confirmRemove.cancel}
                    />
                  ) : (
                    <button onClick={() => confirmRemove.ask(npc.id)} title={t('remove_from_session')}
                      className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100">
                      <span className="material-symbols-outlined text-[14px]">person_remove</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </SectionPanel>
  );
}
