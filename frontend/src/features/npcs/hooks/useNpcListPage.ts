/**
 * Page-level state and data for NpcListPage (Tier 2 list page).
 *
 * Loads:
 * - The campaign (for the title in the back link + GM role check)
 * - The full list of NPCs for the campaign
 * - The species catalog (for the "species" column when the section is enabled)
 *
 * Owns the page-level UI state:
 * - URL search params (q, status) — mirrored into search + statusFilter
 * - addOpen — whether the "add NPC" drawer is open
 *
 * Derives:
 * - statusFilters (all + each status with counts)
 * - filtered (search + status filter applied)
 * - resolveSpeciesName — helper used by the list row to prefer the species
 *   catalog name when available, falling back to the free-text npc.species
 *
 * Section widgets receive minimal props and do not re-fetch the list themselves,
 * matching the list-page pattern established by useLocationListPage.
 */
import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useNpcs, useSetNpcVisibility } from '@/features/npcs/api/queries';
import { useSpecies } from '@/features/species/api';
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
  count: number;
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
  isError: boolean;
  npcs: NPC[] | undefined;
  filtered: NPC[];
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

  const { data: npcs, isLoading, isError } = useNpcs(campaignId);
  const { data: allSpecies } = useSpecies(campaignId);
  const setNpcVisibility = useSetNpcVisibility();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

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

  const statusFilters = useMemo<StatusFilterOption[]>(() => {
    return STATUS_KEYS.map((value) => ({
      value,
      label: t(`status_${value}`),
      count:
        value === 'all'
          ? npcs?.length ?? 0
          : npcs?.filter((n) => n.status === value).length ?? 0,
    }));
  }, [npcs, t]);

  const filtered = useMemo(() => {
    if (!npcs) return [];
    const q = search.toLowerCase();
    return npcs.filter((n) => {
      const matchSearch =
        !search ||
        n.name.toLowerCase().includes(q) ||
        n.aliases.some((a) => a.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [npcs, search, statusFilter]);

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
    isError,
    npcs,
    filtered,
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
