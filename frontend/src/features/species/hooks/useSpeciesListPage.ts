/**
 * Page-level state and data for SpeciesPage (Tier 2 list page).
 *
 * Loads:
 * - The campaign (for the title in the back link)
 * - The full list of species for the campaign
 * - The species types catalog (for the type filter chips and row label)
 *
 * Owns the page-level UI state:
 * - URL search params (q, type) — mirrored into search + typeFilter
 * - drawerOpen — whether the "add species" drawer is open
 *
 * Derives:
 * - typeFilters (all + each known type) — empty list when the
 *   species_types section is disabled
 * - filtered (client-side search + type filter applied)
 * - resolveTypeName — helper used by the list row to look up the name for
 *   a species' type id, falling back to the raw id. Returns an empty string
 *   when species_types is disabled (to match legacy behavior).
 *
 * Matches the list-page pattern established by useGroupListPage /
 * useNpcListPage: the hook owns shared state and hands minimal props down
 * to presentational section widgets. Filtering is client-side.
 */
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useSpecies } from '@/features/species/api';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import type { Species } from '@/entities/species';

export interface TypeFilterOption {
  value: string;
  label: string;
}

export interface UseSpeciesListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  speciesEnabled: boolean;
  typesEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
  speciesList: Species[] | undefined;
  filtered: Species[];
  typeFilters: TypeFilterOption[];
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  resolveTypeName: (typeId: string) => string;
  countForType: (value: string) => number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export function useSpeciesListPage(campaignId: string): UseSpeciesListPageResult {
  const { t } = useTranslation('species');

  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const typesEnabled = useSectionEnabled(campaignId, 'species_types');
  const { data: campaign } = useCampaign(campaignId);
  const { data: speciesList, isLoading, isError } = useSpecies(campaignId);
  const { data: speciesTypes } = useSpeciesTypes(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? 'all';

  const [drawerOpen, setDrawerOpen] = useState(false);

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
    if (!typesEnabled) return [];
    return [
      { value: 'all', label: t('filter_all') },
      ...(speciesTypes ?? []).map((st) => ({ value: st.id, label: st.name })),
    ];
  }, [typesEnabled, speciesTypes, t]);

  const filtered = useMemo(() => {
    if (!speciesList) return [];
    const q = search.trim().toLowerCase();
    return speciesList.filter((s) => {
      const matchSearch = !q || s.name.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [speciesList, search, typeFilter]);

  const resolveTypeName = useCallback(
    (typeId: string) => {
      if (!typesEnabled) return '';
      return speciesTypes?.find((st) => st.id === typeId)?.name ?? typeId;
    },
    [typesEnabled, speciesTypes],
  );

  const countForType = useCallback(
    (value: string) => {
      if (value === 'all') return speciesList?.length ?? 0;
      return speciesList?.filter((s) => s.type === value).length ?? 0;
    },
    [speciesList],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    speciesEnabled,
    typesEnabled,
    isLoading,
    isError,
    speciesList,
    filtered,
    typeFilters,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    resolveTypeName,
    countForType,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };
}
