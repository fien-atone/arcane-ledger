/**
 * NPC group memberships section — list of groups this NPC belongs to,
 * with add/remove flow and per-membership visibility toggle.
 *
 * Self-contained: fetches its own groups list.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/features/groups/api';
import {
  useAddNPCGroupMembership,
  useRemoveNPCGroupMembership,
  useSetNPCGroupMembershipVisibility,
} from '@/features/npcs/api/queries';
import type { NPC } from '@/entities/npc';

interface Props {
  campaignId: string;
  npc: NPC;
  isGm: boolean;
  enabled: boolean;
  partyEnabled: boolean;
}

export function NpcGroupMembershipsSection({ campaignId, npc, isGm, enabled, partyEnabled }: Props) {
  const { t } = useTranslation('npcs');
  const { data: groups } = useGroups(campaignId);
  const addGroupMembership = useAddNPCGroupMembership();
  const removeGroupMembership = useRemoveNPCGroupMembership();
  const setGroupMembershipVisibility = useSetNPCGroupMembershipVisibility();

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupSearch, setAddGroupSearch] = useState('');
  const [addGroupRole, setAddGroupRole] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [confirmRemoveGroupId, setConfirmRemoveGroupId] = useState<string | null>(null);

  if (!enabled) return null;

  const groupNameById = (id: string) => groups?.find((g) => g.id === id)?.name ?? id;
  const memberGroupIds = new Set(npc.groupMemberships.map((m) => m.groupId));
  const availableGroups = (groups ?? [])
    .filter((g) => !memberGroupIds.has(g.id))
    .filter((g) => !addGroupSearch.trim() || g.name.toLowerCase().includes(addGroupSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAddGroup = () => {
    if (!selectedGroupId) return;
    addGroupMembership.mutate(
      { npcId: npc.id, groupId: selectedGroupId, relation: addGroupRole.trim() || undefined },
      { onSuccess: () => { setAddGroupOpen(false); setAddGroupSearch(''); setAddGroupRole(''); setSelectedGroupId(null); } },
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    removeGroupMembership.mutate({ npcId: npc.id, groupId });
    setConfirmRemoveGroupId(null);
  };

  return (
    <section className="space-y-8 min-w-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
          {t('section_group_memberships')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        {isGm && (
          <button
            onClick={() => { setAddGroupOpen((v) => !v); setAddGroupSearch(''); setAddGroupRole(''); setSelectedGroupId(null); }}
            className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
          >
            <span className="material-symbols-outlined text-[13px]">group_add</span>
            {t('add')}
          </button>
        )}
      </div>

      {addGroupOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
            <input
              autoFocus
              type="text"
              value={addGroupSearch}
              onChange={(e) => setAddGroupSearch(e.target.value)}
              placeholder={t('search_groups')}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableGroups.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">
                {(groups ?? []).length === 0 ? t('no_groups_in_campaign') : t('no_groups_found')}
              </p>
            ) : availableGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(selectedGroupId === g.id ? null : g.id)}
                className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                  selectedGroupId === g.id ? 'bg-primary/8 border-l-2 border-primary' : 'hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] text-primary">groups</span>
                <span className={`text-xs ${selectedGroupId === g.id ? 'text-primary font-medium' : 'text-on-surface'}`}>{g.name}</span>
                {selectedGroupId === g.id && (
                  <span className="material-symbols-outlined text-primary text-[14px] ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </button>
            ))}
          </div>
          {selectedGroupId && (
            <div className="px-4 py-3 border-t border-outline-variant/20 space-y-3">
              <div>
                <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">
                  {t('role_label')} <span className="normal-case tracking-normal text-on-surface-variant/40">{t('role_optional')}</span>
                </label>
                <input
                  type="text"
                  value={addGroupRole}
                  onChange={(e) => setAddGroupRole(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddGroup(); }}
                  placeholder={t('role_placeholder')}
                  className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary rounded-sm py-1.5 px-2 text-xs text-on-surface focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => { setAddGroupOpen(false); setSelectedGroupId(null); }}
                  className="px-3 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddGroup}
                  disabled={addGroupMembership.isPending}
                  className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[13px]">group_add</span>
                  {t('add')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {npc.groupMemberships.length === 0 && !addGroupOpen ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_group_memberships')}</p>
      ) : npc.groupMemberships.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {[...npc.groupMemberships].sort((a, b) => groupNameById(a.groupId).localeCompare(groupNameById(b.groupId))).map((m) => (
            <div key={m.groupId} className="group/card flex items-stretch bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 rounded-sm overflow-hidden transition-all">
              <Link
                to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                className="group flex items-center flex-1 min-w-0 px-3 py-2.5 gap-2.5"
              >
                <span className="material-symbols-outlined text-primary flex-shrink-0 text-[18px]">groups</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    {m.subfaction ?? groupNameById(m.groupId)}
                  </p>
                  {m.relation && (
                    <p className="text-[9px] text-on-surface-variant/50 uppercase tracking-wider truncate">
                      {m.relation}
                    </p>
                  )}
                </div>
              </Link>
              {isGm && (confirmRemoveGroupId === m.groupId ? (
                <div className="flex items-center gap-1 px-2 py-3 border-l border-outline-variant/10 bg-error/5">
                  <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{t('confirm_remove')}</span>
                  <button
                    onClick={() => handleRemoveGroup(m.groupId)}
                    className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                  >
                    {t('confirm_yes')}
                  </button>
                  <button
                    onClick={() => setConfirmRemoveGroupId(null)}
                    className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {t('confirm_no')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemoveGroupId(m.groupId)}
                  title={t('remove_from_group')}
                  className="px-2 py-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              ))}
              {isGm && partyEnabled && (
                <button
                  onClick={() => setGroupMembershipVisibility.mutate({ npcId: npc.id, groupId: m.groupId, playerVisible: !(m.playerVisible ?? true) })}
                  title={m.playerVisible === false ? t('hidden_click_to_show') : t('visible_click_to_hide')}
                  className={`px-2 py-3 border-l border-outline-variant/10 transition-colors ${
                    m.playerVisible === false
                      ? 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                      : 'text-primary/60 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {m.playerVisible === false ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
