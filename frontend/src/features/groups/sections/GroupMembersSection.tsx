/**
 * GroupMembersSection — list of NPCs and party characters that belong to a group.
 *
 * Self-contained: fetches its own NPCs list and party (when party module is on),
 * owns the add/remove flow plus the per-membership visibility toggle, and renders
 * the slide-out AddMemberPanel for picking new NPC members.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useNpcs,
  useAddNPCGroupMembership,
  useRemoveNPCGroupMembership,
  useSetNPCGroupMembershipVisibility,
} from '@/features/npcs/api/queries';
import { useParty, useRemoveCharacterGroupMembership } from '@/features/characters/api/queries';
import type { NPC, NpcStatus } from '@/entities/npc';

const STATUS_DOT: Record<NpcStatus, string> = {
  alive:   'bg-secondary',
  dead:    'bg-outline-variant',
  missing: 'bg-on-surface-variant',
  unknown: 'bg-outline',
};

interface Props {
  campaignId: string;
  groupId: string;
  isGm: boolean;
  partyEnabled: boolean;
}

export function GroupMembersSection({ campaignId, groupId, isGm, partyEnabled }: Props) {
  const { t } = useTranslation('groups');
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: party } = useParty(campaignId);
  const removeMembership = useRemoveNPCGroupMembership();
  const setMembershipVisibility = useSetNPCGroupMembershipVisibility();
  const removeCharMembership = useRemoveCharacterGroupMembership();

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmRemoveCharId, setConfirmRemoveCharId] = useState<string | null>(null);

  const members = (allNpcs ?? [])
    .filter((n) => n.groupMemberships.some((m) => m.groupId === groupId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const nonMembers = (allNpcs ?? [])
    .filter((n) => !n.groupMemberships.some((m) => m.groupId === groupId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const charMembers = partyEnabled
    ? (party ?? [])
        .filter((c) => (c.groupMemberships ?? []).some((m) => m.groupId === groupId))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const handleRemoveMember = (npc: NPC) => {
    removeMembership.mutate({ npcId: npc.id, groupId });
  };

  return (
    <>
      <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">{t('section_members')}</h2>
          <div className="h-px flex-1 bg-outline-variant/20" />
          {(members.length + charMembers.length) > 0 && (
            <span className="text-xs font-bold text-on-surface-variant/40">{members.length + charMembers.length}</span>
          )}
          {isGm && (
            <button onClick={() => setAddMemberOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all">
              <span className="material-symbols-outlined text-[13px]">person_add</span>
              {t('add')}
            </button>
          )}
        </div>
        {members.length === 0 && charMembers.length === 0 ? (
          <p className="text-sm text-on-surface-variant/40 italic">{t('no_members')}</p>
        ) : (
          <div className="space-y-2">
            {members.map((npc) => {
              const membership = npc.groupMemberships.find((m) => m.groupId === groupId);
              const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              const dot = STATUS_DOT[npc.status];
              return (
                <div key={npc.id} className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 hover:border-outline-variant/30 transition-all group/card">
                  <Link to={`/campaigns/${campaignId}/npcs/${npc.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-low ${dot}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors truncate">{npc.name}</p>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                        {[npc.species, membership?.relation].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </Link>
                  {isGm && (confirmRemoveId === npc.id ? (
                    <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5 flex-shrink-0">
                      <span className="text-[10px] text-on-surface-variant">{t('confirm_remove')}</span>
                      <button onClick={() => { handleRemoveMember(npc); setConfirmRemoveId(null); }}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">{t('confirm_yes')}</button>
                      <button onClick={() => setConfirmRemoveId(null)}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">{t('confirm_no')}</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemoveId(npc.id)} title={t('remove_from_group')}
                      className="flex-shrink-0 opacity-0 group-hover/card:opacity-100 px-2 py-1 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-all">
                      <span className="material-symbols-outlined text-[16px]">person_remove</span>
                    </button>
                  ))}
                  {isGm && partyEnabled && membership && (
                    <button
                      onClick={() => setMembershipVisibility.mutate({ npcId: npc.id, groupId, playerVisible: !membership.playerVisible })}
                      title={membership.playerVisible ? t('visible_to_players') : t('hidden_from_players')}
                      className={`flex-shrink-0 p-1.5 transition-colors ${
                        membership.playerVisible
                          ? 'text-primary/60 hover:text-primary'
                          : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {membership.playerVisible ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
            {charMembers.map((char) => {
              const membership = (char.groupMemberships ?? []).find((m) => m.groupId === groupId);
              const initials = char.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              return (
                <div key={char.id} className="flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-secondary/10 hover:border-secondary/30 transition-all group/card">
                  <Link to={`/campaigns/${campaignId}/characters/${char.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-sm bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-secondary/60">{initials}</span>
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface-container-low bg-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-on-surface group-hover:text-secondary transition-colors truncate">{char.name}</p>
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                        {[char.class, membership?.relation].filter(Boolean).join(' · ') || t('section_pc_label')}
                      </p>
                    </div>
                  </Link>
                  {isGm && (confirmRemoveCharId === char.id ? (
                    <div className="flex items-center gap-1 px-2 border-l border-outline-variant/10 bg-error/5 flex-shrink-0">
                      <span className="text-[10px] text-on-surface-variant">{t('confirm_remove')}</span>
                      <button onClick={() => { removeCharMembership.mutate({ characterId: char.id, groupId }); setConfirmRemoveCharId(null); }}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors">{t('confirm_yes')}</button>
                      <button onClick={() => setConfirmRemoveCharId(null)}
                        className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors">{t('confirm_no')}</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmRemoveCharId(char.id)} title={t('remove_from_group')}
                      className="flex-shrink-0 opacity-0 group-hover/card:opacity-100 px-2 py-1 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-all">
                      <span className="material-symbols-outlined text-[16px]">person_remove</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addMemberOpen && (
        <AddMemberPanel onClose={() => setAddMemberOpen(false)} groupId={groupId} nonMembers={nonMembers} />
      )}
    </>
  );
}

// ── Add Member Panel ─────────────────────────────────────────────────────────

interface AddMemberPanelProps {
  onClose: () => void;
  groupId: string;
  nonMembers: NPC[];
}

function AddMemberPanel({ onClose, groupId, nonMembers }: AddMemberPanelProps) {
  const { t } = useTranslation('groups');
  const addMembership = useAddNPCGroupMembership();
  const [search, setSearch] = useState('');
  const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
  const [role, setRole] = useState('');

  const filtered = nonMembers.filter((n) =>
    !search || n.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!selectedNpc) return;
    addMembership.mutate(
      { npcId: selectedNpc.id, groupId, relation: role.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-md flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">
        <div className="flex items-center justify-between px-8 py-6 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-xl font-bold text-on-surface">{t('add_member_title')}</h2>
            <p className="text-[11px] text-on-surface-variant uppercase tracking-widest mt-0.5">{t('add_member_subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-8 pt-5 pb-3 flex-shrink-0">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">search</span>
            <input type="text" placeholder={t('search_npcs')} value={search} onChange={(e) => setSearch(e.target.value)} autoFocus
              className="w-full pl-8 pr-3 py-2 bg-surface-container border border-outline-variant/20 focus:border-primary rounded-sm text-on-surface text-sm placeholder:text-on-surface-variant/30 focus:ring-0 focus:outline-none transition-colors" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-8">
          {filtered.length === 0 ? (
            <p className="text-sm text-on-surface-variant/40 italic py-6 text-center">
              {nonMembers.length === 0 ? t('all_npcs_members') : t('no_npcs_found')}
            </p>
          ) : (
            <div className="space-y-1 py-2">
              {filtered.map((npc) => {
                const initials = npc.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                const isSelected = selectedNpc?.id === npc.id;
                return (
                  <button key={npc.id} type="button" onClick={() => setSelectedNpc(isSelected ? null : npc)}
                    className={`w-full flex items-center gap-3 p-3 rounded-sm border transition-all text-left ${isSelected ? 'bg-primary/8 border-primary/30' : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container'}`}>
                    <div className="w-9 h-9 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{npc.name}</p>
                      {npc.species && <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">{npc.species}</p>}
                    </div>
                    {isSelected && <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest space-y-4">
          {selectedNpc && (
            <div>
              <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5">
                {t('role_label')} <span className="normal-case tracking-normal text-on-surface-variant/40">{t('role_optional')}</span>
              </label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} placeholder={t('role_placeholder')}
                className="w-full bg-surface-container-low border border-outline-variant/25 focus:border-primary rounded-sm py-2 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30" />
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 text-xs font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">{t('cancel')}</button>
            <button onClick={handleAdd} disabled={!selectedNpc || addMembership.isPending}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
              <span className="material-symbols-outlined text-sm">person_add</span>
              {t('add_member')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
