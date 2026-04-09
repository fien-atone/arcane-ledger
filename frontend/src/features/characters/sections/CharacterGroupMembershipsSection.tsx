/**
 * Character group memberships section — list of groups this character
 * belongs to, with add/remove flow.
 *
 * Self-contained: fetches its own groups list. Gated by canViewAll (GM or
 * character owner) and the campaign `groups` section flag.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGroups } from '@/features/groups/api';
import {
  useAddCharacterGroupMembership,
  useRemoveCharacterGroupMembership,
} from '@/features/characters/api/queries';
import { SectionPanel } from '@/shared/ui';
import type { PlayerCharacter } from '@/entities/character';

interface Props {
  campaignId: string;
  character: PlayerCharacter;
  isGm: boolean;
  canViewAll: boolean;
  enabled: boolean;
}

export function CharacterGroupMembershipsSection({
  campaignId,
  character,
  isGm,
  canViewAll,
  enabled,
}: Props) {
  const { t } = useTranslation('party');
  const { data: groups } = useGroups(campaignId);
  const addGroupMembership = useAddCharacterGroupMembership();
  const removeGroupMembership = useRemoveCharacterGroupMembership();

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupSearch, setAddGroupSearch] = useState('');
  const [addGroupRole, setAddGroupRole] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [confirmRemoveGroupId, setConfirmRemoveGroupId] = useState<string | null>(null);

  if (!canViewAll || !enabled) return null;

  const memberGroupIds = new Set((character.groupMemberships ?? []).map((m) => m.groupId));
  const availableGroups = (groups ?? [])
    .filter((g) => !memberGroupIds.has(g.id))
    .filter((g) => !addGroupSearch.trim() || g.name.toLowerCase().includes(addGroupSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const groupNameById = (id: string) => groups?.find((g) => g.id === id)?.name ?? id;

  const handleAddGroup = () => {
    if (!selectedGroupId) return;
    addGroupMembership.mutate(
      { characterId: character.id, groupId: selectedGroupId, relation: addGroupRole.trim() || undefined },
      {
        onSuccess: () => {
          setAddGroupOpen(false);
          setAddGroupSearch('');
          setAddGroupRole('');
          setSelectedGroupId(null);
        },
      },
    );
  };

  const handleRemoveGroup = (groupId: string) => {
    removeGroupMembership.mutate({ characterId: character.id, groupId });
    setConfirmRemoveGroupId(null);
  };

  return (
    <SectionPanel
      title={t('detail.section_group_memberships')}
      action={isGm ? (
        <button
          onClick={() => {
            setAddGroupOpen((v) => !v);
            setAddGroupSearch('');
            setAddGroupRole('');
            setSelectedGroupId(null);
          }}
          className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
        >
          <span className="material-symbols-outlined text-[13px]">group_add</span>
          {t('detail.add')}
        </button>
      ) : undefined}
    >
      <div className="space-y-4">
      {addGroupOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">
              search
            </span>
            <input
              autoFocus
              type="text"
              value={addGroupSearch}
              onChange={(e) => setAddGroupSearch(e.target.value)}
              placeholder={t('detail.search_groups')}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {availableGroups.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">
                {(groups ?? []).length === 0 ? t('detail.no_groups_in_campaign') : t('detail.no_groups_found')}
              </p>
            ) : (
              availableGroups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupId(selectedGroupId === g.id ? null : g.id)}
                  className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-colors ${
                    selectedGroupId === g.id
                      ? 'bg-primary/8 border-l-2 border-primary'
                      : 'hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px] text-primary">groups</span>
                  <span
                    className={`text-xs ${
                      selectedGroupId === g.id ? 'text-primary font-medium' : 'text-on-surface'
                    }`}
                  >
                    {g.name}
                  </span>
                  {selectedGroupId === g.id && (
                    <span
                      className="material-symbols-outlined text-primary text-[14px] ml-auto"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
          {selectedGroupId && (
            <div className="px-4 py-3 border-t border-outline-variant/20 space-y-3">
              <div>
                <label className="block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">
                  {t('detail.role_label')}{' '}
                  <span className="normal-case tracking-normal text-on-surface-variant/40">
                    {t('detail.role_optional')}
                  </span>
                </label>
                <input
                  type="text"
                  value={addGroupRole}
                  onChange={(e) => setAddGroupRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGroup();
                  }}
                  placeholder={t('detail.role_placeholder')}
                  className="w-full bg-surface-container border border-outline-variant/20 focus:border-primary rounded-sm py-1.5 px-2 text-xs text-on-surface focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setAddGroupOpen(false);
                    setSelectedGroupId(null);
                  }}
                  className="px-3 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {t('detail.cancel')}
                </button>
                <button
                  onClick={handleAddGroup}
                  disabled={addGroupMembership.isPending}
                  className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-label uppercase tracking-widest rounded-sm disabled:opacity-40 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[13px]">group_add</span>
                  {t('detail.add')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(character.groupMemberships ?? []).length === 0 && !addGroupOpen ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('detail.no_group_memberships')}</p>
      ) : (character.groupMemberships ?? []).length > 0 ? (
        <div className="flex flex-wrap gap-4">
          {(character.groupMemberships ?? []).map((m) => (
            <div
              key={m.groupId}
              className="group/card flex items-center bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 transition-all"
            >
              <Link
                to={`/campaigns/${campaignId}/groups/${m.groupId}`}
                className="group flex items-center px-4 py-3"
              >
                <span className="material-symbols-outlined text-primary mr-3">groups</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                    {m.subfaction ?? groupNameById(m.groupId)}
                  </span>
                  {m.relation && (
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-tighter">
                      {m.relation}
                    </span>
                  )}
                </div>
                <span className="material-symbols-outlined text-xs text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                  arrow_forward
                </span>
              </Link>
              {isGm &&
                (confirmRemoveGroupId === m.groupId ? (
                  <div className="flex items-center gap-1 px-2 py-3 border-l border-outline-variant/10 bg-error/5">
                    <span className="text-[10px] text-on-surface-variant whitespace-nowrap">
                      {t('detail.confirm_remove')}
                    </span>
                    <button
                      onClick={() => handleRemoveGroup(m.groupId)}
                      className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                    >
                      {t('detail.confirm_yes')}
                    </button>
                    <button
                      onClick={() => setConfirmRemoveGroupId(null)}
                      className="px-2 py-1 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {t('detail.confirm_no')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRemoveGroupId(m.groupId)}
                    title={t('detail.remove_from_group')}
                    className="px-2 py-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : null}
      </div>
    </SectionPanel>
  );
}
