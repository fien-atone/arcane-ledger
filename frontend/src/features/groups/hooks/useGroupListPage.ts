/**
 * Page-level state and data for GroupListPage (Tier 2 list page).
 *
 * F-11: search and type filtering are SERVER-SIDE. This hook:
 *
 *  - Reads `?q` and `?type` from the URL
 *  - Drives the <input> off a local debounced state (300 ms)
 *  - Passes the debounced search + type to `useGroups`, which uses Apollo
 *    v4's `previousData` to keep the existing list visible during
 *    refetches. The Groups resolver already handled server-side
 *    search/type — F-11 just removes the redundant client-side filter
 *    and adds the flicker-free refetch behaviour.
 *  - Removes the client-side `useMemo` filter — the list returned from
 *    the query is already filtered by the server.
 *
 * Type-filter chip counts: removed for the F-11 pilot. The server returns
 * the filtered list, so counts per type are no longer directly available.
 *
 * Loads:
 * - The campaign (for the title + GM role check)
 * - The (server-filtered) list of groups for the campaign
 * - The group types catalog (for the type filter chips and row icon)
 *
 * Owns the page-level UI state:
 * - URL search params (q, type) — mirrored into search + typeFilter
 * - addOpen — whether the "add group" drawer is open
 */
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useGroups, useSetGroupVisibility } from '@/features/groups/api';
import { useGroupTypes } from '@/features/groupTypes';
import { useDebouncedSearch } from '@/shared/hooks';
import type { Group } from '@/entities/group';
import type { GroupTypeEntry } from '@/entities/groupType';

export interface TypeFilterOption {
  value: string;
  label: string;
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
  isFetching: boolean;
  isError: boolean;
  /** Server-filtered list. Stays populated via Apollo previousData during
   *  in-flight refetches. */
  groups: Group[] | undefined;
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

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? 'all';

  const { value: search, debouncedValue: debouncedSearch, setValue: setDebouncedSearch } =
    useDebouncedSearch(urlSearch, 300);

  const typeForQuery = typeFilter === 'all' ? undefined : typeFilter;

  const { data: groups, isLoading, isFetching, isError } = useGroups(campaignId, {
    search: debouncedSearch || undefined,
    type: typeForQuery,
  });
  const { data: groupTypes } = useGroupTypes(campaignId);
  const setGroupVisibility = useSetGroupVisibility();

  const [addOpen, setAddOpen] = useState(false);

  const setSearch = useCallback(
    (val: string) => {
      setDebouncedSearch(val);
      setSearchParams(
        (prev) => {
          if (val) prev.set('q', val);
          else prev.delete('q');
          return prev;
        },
        { replace: true },
      );
    },
    [setDebouncedSearch, setSearchParams],
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
    const entries: TypeFilterOption[] = [
      { value: 'all', label: t('filter_all') },
    ];
    for (const gt of groupTypes ?? []) {
      entries.push({ value: gt.id, label: gt.name });
    }
    return entries;
  }, [groupTypesEnabled, groupTypes, t]);

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
    isFetching,
    isError,
    groups,
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
