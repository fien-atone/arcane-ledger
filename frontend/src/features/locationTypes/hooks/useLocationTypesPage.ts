/**
 * Page-level state and data for LocationTypesPage.
 *
 * Loads:
 * - The campaign (for the title in the back link + role check)
 * - The (server-filtered) list of location types
 * - The full set of containment rules
 *
 * F-11 sweep: search is SERVER-SIDE. Uses `useDebouncedSearch` (300 ms) to
 * drive the query variable; `useLocationTypes` returns `data ?? previousData`
 * to keep the existing list visible while the new query is in flight.
 *
 * Owns the page-level UI state:
 * - selectedTypeId — which type is currently shown in the right panel
 * - showNew — whether the right panel is in "create new type" mode
 * - search — left-list search filter
 *
 * Derives:
 * - sorted — list sorted by category order (client-side sort applied on
 *   top of the already-filtered server list)
 * - filtered — alias for `sorted` (kept for call-site compatibility with
 *   `LocationTypesListSection`, which still takes a `filtered` prop)
 * - selected — currently-shown LocationTypeEntry, defaults to first sorted entry
 *
 * Section widgets receive minimal props (selected entry, helpers) and do not
 * re-fetch the type list themselves.
 */
import { useMemo, useState } from 'react';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import {
  useLocationTypes,
  useContainmentRules,
} from '@/features/locationTypes';
import { useDebouncedSearch } from '@/shared/hooks';
import type {
  LocationTypeEntry,
  LocationTypeCategory,
  LocationTypeContainmentRule,
} from '@/entities/locationType';

export const CATEGORY_ORDER: LocationTypeCategory[] = [
  'world',
  'civilization',
  'geographic',
  'water',
  'poi',
  'travel',
];

export interface UseLocationTypesPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  locationTypesEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isFetching: boolean;
  types: LocationTypeEntry[];
  containRules: LocationTypeContainmentRule[];
  sorted: LocationTypeEntry[];
  filtered: LocationTypeEntry[];
  selected: LocationTypeEntry | null;
  selectedTypeId: string | null;
  setSelectedTypeId: (id: string | null) => void;
  showNew: boolean;
  setShowNew: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
  startNew: () => void;
  selectType: (id: string) => void;
  cancelNew: () => void;
  finishCreate: (savedId: string) => void;
  clearSelection: () => void;
}

export function useLocationTypesPage(campaignId: string): UseLocationTypesPageResult {
  const { data: campaign } = useCampaign(campaignId);
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');

  const {
    value: search,
    debouncedValue: debouncedSearch,
    setValue: setSearch,
  } = useDebouncedSearch('', 300);

  const {
    data: types,
    isLoading: loadingTypes,
    isFetching: fetchingTypes,
  } = useLocationTypes(campaignId, { search: debouncedSearch || undefined });
  const { data: containRules, isLoading: loadingContain } = useContainmentRules();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const isLoading = loadingTypes || loadingContain;

  const allTypes = types ?? [];
  const allRules = containRules ?? [];

  const sorted = useMemo(
    () =>
      [...allTypes].sort(
        (a, b) =>
          CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
      ),
    [allTypes],
  );

  // `filtered` is identical to `sorted` now that filtering is server-side.
  // Kept as a distinct alias so `LocationTypesListSection` (which still
  // takes a `filtered` prop) doesn't need to change.
  const filtered = sorted;

  const selected =
    allTypes.find((t) => t.id === selectedTypeId) ?? sorted[0] ?? null;

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
    locationTypesEnabled,
    isGm,
    isLoading,
    isFetching: fetchingTypes,
    types: allTypes,
    containRules: allRules,
    sorted,
    filtered,
    selected,
    selectedTypeId,
    setSelectedTypeId,
    showNew,
    setShowNew,
    search,
    setSearch,
    startNew,
    selectType,
    cancelNew,
    finishCreate,
    clearSelection,
  };
}
