/**
 * Page-level state and data for GroupListPage (Tier 2 list page).
 *
 * Loads:
 * - The campaign (for the title in the back link + GM role check)
 * - The full list of groups for the campaign
 * - The group types catalog (for the type filter chips and row icon)
 *
 * Owns the page-level UI state:
 * - URL search params (q, type) — mirrored into search + typeFilter
 * - addOpen — whether the "add group" drawer is open
 *
 * Derives:
 * - typeFilters (all + each known type with counts) — empty list when
 *   the group_types section is disabled
 * - filtered (client-side search + type filter applied)
 * - resolveType — helper used by the list row to look up name + icon
 *   for a group's type id, falling back to the raw type id.
 *
 * Matches the list-page pattern established by useNpcListPage /
 * useLocationListPage: the hook owns shared state and hands minimal props
 * down to presentational section widgets. Filtering is client-side
 * (consistent with GroupTypesPage) — server-side search/type will be
 * handled in the F-11 sweep later.
 */
import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useGroups, useSetGroupVisibility } from '@/features/groups/api';
import { useGroupTypes } from '@/features/groupTypes';
import type { Group } from '@/entities/group';
import type { GroupTypeEntry } from '@/entities/groupType';

export interface TypeFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface ResolvedGroupType {
  name: string;
  icon: string;
}

export interface UseGroupListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  groupsEnabled: boolean;
  groupTypesEnabled: boolean;
  partyEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isError: boolean;
  groups: Group[] | undefined;
  filtered: Group[];
  typeFilters: TypeFilterOption[];
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  resolveType: (typeId: string) => ResolvedGroupType;
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  toggleVisibility: (group: Group) => void;
}

export function useGroupListPage(campaignId: string): UseGroupListPageResult {
  const { t } = useTranslation('groups');
  const groupsEnabled = useSectionEnabled(campaignId, 'groups');
  const groupTypesEnabled = useSectionEnabled(campaignId, 'group_types');
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const { data: campaign } = useCampaign(campaignId);
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  // Client-side filtering: always fetch the full list, filter in memory.
  const { data: groups, isLoading, isError } = useGroups(campaignId);
  const { data: groupTypes } = useGroupTypes(campaignId);
  const setGroupVisibility = useSetGroupVisibility();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? 'all';

  const [addOpen, setAddOpen] = useState(false);

  const setSearch = useCallback(
    (val: string) => {
      setSearchParams(
        (prev) => {
          if (val) prev.set('q', val);
          else prev.delete('q');
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setTypeFilter = useCallback(
    (val: string) => {
      setSearchParams(
        (prev) => {
          if (val === 'all') prev.delete('type');
          else prev.set('type', val);
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const typeFilters = useMemo<TypeFilterOption[]>(() => {
    if (!groupTypesEnabled) return [];
    const total = groups?.length ?? 0;
    const entries: TypeFilterOption[] = [
      { value: 'all', label: t('filter_all'), count: total },
    ];
    for (const gt of groupTypes ?? []) {
      entries.push({
        value: gt.id,
        label: gt.name,
        count: groups?.filter((g) => g.type === gt.id).length ?? 0,
      });
    }
    return entries;
  }, [groupTypesEnabled, groupTypes, groups, t]);

  const filtered = useMemo(() => {
    if (!groups) return [];
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      const matchSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.aliases ?? []).some((a) => a.toLowerCase().includes(q));
      const matchType = typeFilter === 'all' || g.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [groups, search, typeFilter]);

  const resolveType = useCallback(
    (typeId: string): ResolvedGroupType => {
      const found = (groupTypes as GroupTypeEntry[] | undefined)?.find(
        (gt) => gt.id === typeId,
      );
      return found
        ? { name: found.name, icon: found.icon }
        : { name: typeId, icon: 'category' };
    },
    [groupTypes],
  );

  const toggleVisibility = useCallback(
    (group: Group) => {
      setGroupVisibility.mutate({
        campaignId,
        id: group.id,
        playerVisible: !group.playerVisible,
        playerVisibleFields: group.playerVisibleFields ?? [],
      });
    },
    [campaignId, setGroupVisibility],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    groupsEnabled,
    groupTypesEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    groups,
    filtered,
    typeFilters,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    resolveType,
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),
    toggleVisibility,
  };
}
