/**
 * Page-level state and data for SpeciesTypesPage.
 *
 * Loads:
 * - The campaign (for the title in the back link + role check)
 * - The (server-filtered) list of species types — search is debounced
 *   and pushed into the GraphQL variable.
 *
 * F-11 sweep: search is SERVER-SIDE. Uses `useDebouncedSearch` (300 ms)
 * to drive the query variable; `useSpeciesTypes` returns `data ?? previousData`
 * to keep the existing list visible while the new query is in flight.
 *
 * Owns the page-level UI state:
 * - selectedTypeId — which type is currently shown in the right panel
 * - showNew — whether the right panel is in "create new type" mode
 * - search — left-list search filter
 *
 * Section widgets receive minimal props (selected entry, helpers) and do not
 * re-fetch the type list themselves.
 */
import { useState } from 'react';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useSpeciesTypes } from '@/features/speciesTypes/api';
import { useDebouncedSearch } from '@/shared/hooks';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

export interface UseSpeciesTypesPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  speciesTypesEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isFetching: boolean;
  types: SpeciesTypeEntry[];
  selected: SpeciesTypeEntry | null;
  selectedTypeId: string | null;
  showNew: boolean;
  search: string;
  setSearch: (v: string) => void;
  startNew: () => void;
  selectType: (id: string) => void;
  cancelNew: () => void;
  finishCreate: (savedId: string) => void;
  clearSelection: () => void;
}

export function useSpeciesTypesPage(campaignId: string): UseSpeciesTypesPageResult {
  const { data: campaign } = useCampaign(campaignId);
  const speciesTypesEnabled = useSectionEnabled(campaignId, 'species_types');

  const {
    value: search,
    debouncedValue: debouncedSearch,
    setValue: setSearch,
  } = useDebouncedSearch('', 300);

  const {
    data: types,
    isLoading,
    isFetching,
  } = useSpeciesTypes(campaignId, { search: debouncedSearch || undefined });

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const allTypes = types ?? [];

  const selected =
    allTypes.find((t) => t.id === selectedTypeId) ?? allTypes[0] ?? null;

  const startNew = () => {
    setShowNew(true);
    setSelectedTypeId(null);
  };

  const selectType = (id: string) => {
    setSelectedTypeId(id);
    setShowNew(false);
  };

  const cancelNew = () => setShowNew(false);

  /** Called after a new type is successfully saved — closes the form
   *  and selects the newly created type so the user lands on its edit card. */
  const finishCreate = (savedId: string) => {
    setShowNew(false);
    setSelectedTypeId(savedId);
  };

  const clearSelection = () => setSelectedTypeId(null);

  return {
    campaignId,
    campaignTitle: campaign?.title,
    speciesTypesEnabled,
    isGm,
    isLoading,
    isFetching,
    types: allTypes,
    selected,
    selectedTypeId,
    showNew,
    search,
    setSearch,
    startNew,
    selectType,
    cancelNew,
    finishCreate,
    clearSelection,
  };
}
