/**
 * Page-level state and data for SpeciesPage (Tier 2 list page).
 *
 * F-11: search and type filtering are SERVER-SIDE. This hook:
 *
 *  - Reads `?q` and `?type` from the URL
 *  - Drives the <input> off a local debounced state (300 ms)
 *  - Passes the debounced search + type to `useSpecies`, which uses Apollo
 *    v4's `previousData` to keep the existing list visible during refetches.
 *  - Removes the client-side `useMemo` filter — the list returned from the
 *    query is already filtered by the server.
 *
 * Type-filter counts: removed for the F-11 pilot. `countForType` no longer
 * exists. The filter chips render only labels.
 *
 * Loads:
 * - The campaign (for the title in the back link)
 * - The (server-filtered) list of species for the campaign
 * - The species types catalog (for the type filter chips and row label)
 *
 * Owns the page-level UI state:
 * - URL search params (q, type) — mirrored into search + typeFilter
 * - drawerOpen — whether the "add species" drawer is open
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
import { useDebouncedSearch } from '@/shared/hooks';
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
  isFetching: boolean;
  isError: boolean;
  /** Server-filtered list. Stays populated via Apollo previousData during
   *  in-flight refetches. */
  speciesList: Species[] | undefined;
  typeFilters: TypeFilterOption[];
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;
  setTypeFilter: (v: string) => void;
  resolveTypeName: (typeId: string) => string;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export function useSpeciesListPage(campaignId: string): UseSpeciesListPageResult {
  const { t } = useTranslation('species');

  const speciesEnabled = useSectionEnabled(campaignId, 'species');
  const typesEnabled = useSectionEnabled(campaignId, 'species_types');
  const { data: campaign } = useCampaign(campaignId);

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const typeFilter = searchParams.get('type') ?? 'all';

  const { value: search, debouncedValue: debouncedSearch, setValue: setDebouncedSearch } =
    useDebouncedSearch(urlSearch, 300);

  const typeForQuery = typeFilter === 'all' ? undefined : typeFilter;

  const { data: speciesList, isLoading, isFetching, isError } = useSpecies(campaignId, {
    search: debouncedSearch || undefined,
    type: typeForQuery,
  });
  const { data: speciesTypes } = useSpeciesTypes(campaignId);

  const [drawerOpen, setDrawerOpen] = useState(false);

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
    if (!typesEnabled) return [];
    return [
      { value: 'all', label: t('filter_all') },
      ...(speciesTypes ?? []).map((st) => ({ value: st.id, label: st.name })),
    ];
  }, [typesEnabled, speciesTypes, t]);

  const resolveTypeName = useCallback(
    (typeId: string) => {
      if (!typesEnabled) return '';
      return speciesTypes?.find((st) => st.id === typeId)?.name ?? typeId;
    },
    [typesEnabled, speciesTypes],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    speciesEnabled,
    typesEnabled,
    isLoading,
    isFetching,
    isError,
    speciesList,
    typeFilters,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    resolveTypeName,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };
}
