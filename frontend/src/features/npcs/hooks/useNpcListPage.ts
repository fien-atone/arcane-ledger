/**
 * Page-level state and data for NpcListPage (Tier 2 list page).
 *
 * F-11 pilot: search and status filtering are SERVER-SIDE. This hook:
 *
 *  - Reads `?q` and `?status` from the URL (so refresh/share/back-forward work)
 *  - Drives the <input> off a local debounced state (300 ms) — URL updates
 *    live on every keystroke, but the GraphQL query only re-fires once the
 *    typing pauses
 *  - Passes the debounced search + uppercase status to `useNpcs`, which in
 *    turn uses Apollo v4's `previousData` to keep the existing list visible
 *    while the new query is in flight (no list flicker)
 *  - Removes the client-side `useMemo` filter — the list returned from the
 *    query is already filtered
 *
 * Status-filter counts: removed for the pilot. The server returns the
 * filtered list, so counts per status are no longer available locally.
 * Re-adding them would require a second unfiltered aggregation query —
 * deferred until after the F-11 sweep, per the project decision.
 *
 * Loads:
 * - The campaign (for the title in the back link + GM role check)
 * - The (server-filtered) list of NPCs for the campaign
 * - The species catalog (for the "species" column when the section is enabled)
 *
 * Owns the page-level UI state:
 * - URL search params (q, status) — mirrored into search + statusFilter
 * - addOpen — whether the "add NPC" drawer is open
 *
 * Derives:
 * - statusFilters (all + each status, WITHOUT counts)
 * - resolveSpeciesName — helper used by the list row to prefer the species
 *   catalog name when available, falling back to the free-text npc.species
 */
import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useNpcs, useSetNpcVisibility } from '@/features/npcs/api/queries';
import { useSpecies } from '@/features/species/api';
import { useDebouncedSearch } from '@/shared/hooks';
import type { NPC, NpcStatus } from '@/entities/npc';

export type StatusFilter = 'all' | NpcStatus;

export const STATUS_KEYS: StatusFilter[] = [
  'all',
  'alive',
  'dead',
  'missing',
  'unknown',
];

export interface StatusFilterOption {
  value: StatusFilter;
  label: string;
}

export interface UseNpcListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  npcsEnabled: boolean;
  socialGraphEnabled: boolean;
  speciesEnabled: boolean;
  partyEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Server-filtered list. Stays populated via Apollo previousData during
   *  in-flight refetches — callers should NOT show a blank state based on
   *  isFetching alone. */
  npcs: NPC[] | undefined;
  statusFilters: StatusFilterOption[];
  search: string;
  setSearch: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  resolveSpeciesName: (npc: NPC) => string | undefined;
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  toggleVisibility: (npc: NPC) => void;
}

export function useNpcListPage(campaignId: string): UseNpcListPageResult {
  const { t } = useTranslation('npcs');
  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const socialGraphEnabled = useSectionEnabled(campaignId, 'social_graph');
  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const { data: campaign } = useCampaign(campaignId);
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

  // Debounced search: drives the network variable; the URL and the input
  // stay live on every keystroke.
  const { value: search, debouncedValue: debouncedSearch, setValue: setDebouncedSearch } =
    useDebouncedSearch(urlSearch, 300);

  // `useDebouncedSearch` watches `initialValue` and re-syncs `value` +
  // `debouncedValue` when it changes, so back/forward navigation that
  // updates `?q` in the URL flows through to both the input and the query.

  const statusFilterForQuery = statusFilter === 'all' ? undefined : statusFilter.toUpperCase();

  const {
    data: npcs,
    isLoading,
    isFetching,
    isError,
  } = useNpcs(campaignId, {
    search: debouncedSearch || undefined,
    status: statusFilterForQuery,
  });
  const { data: allSpecies } = useSpecies(campaignId);
  const setNpcVisibility = useSetNpcVisibility();

  const [addOpen, setAddOpen] = useState(false);

  const setSearch = useCallback(
    (val: string) => {
      // URL updates immediately on every keystroke; the query variable
      // (debouncedValue) lags behind by 300 ms.
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

  const setStatusFilter = useCallback(
    (val: StatusFilter) => {
      setSearchParams(
        (prev) => {
          if (val === 'all') prev.delete('status');
          else prev.set('status', val);
          return prev;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const statusFilters = useMemo<StatusFilterOption[]>(
    () =>
      STATUS_KEYS.map((value) => ({
        value,
        label: t(`status_${value}`),
      })),
    [t],
  );

  const resolveSpeciesName = useCallback(
    (npc: NPC): string | undefined => {
      if (!speciesEnabled) return undefined;
      return (
        allSpecies?.find((s) => s.id === npc.speciesId)?.name ?? npc.species
      );
    },
    [speciesEnabled, allSpecies],
  );

  const toggleVisibility = useCallback(
    (npc: NPC) => {
      setNpcVisibility.mutate({
        campaignId,
        id: npc.id,
        playerVisible: !npc.playerVisible,
        playerVisibleFields: npc.playerVisibleFields ?? [],
      });
    },
    [campaignId, setNpcVisibility],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    npcsEnabled,
    socialGraphEnabled,
    speciesEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isFetching,
    isError,
    npcs,
    statusFilters,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    resolveSpeciesName,
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),
    toggleVisibility,
  };
}
