/**
 * Page-level state and data for LocationTypesPage.
 *
 * Loads:
 * - The campaign (for the title in the back link + role check)
 * - The full list of location types
 * - The full set of containment rules
 *
 * Owns the page-level UI state:
 * - selectedTypeId — which type is currently shown in the right panel
 * - showNew — whether the right panel is in "create new type" mode
 * - search — left-list search filter
 *
 * Derives:
 * - sorted (sorted by category order)
 * - filtered (filtered by search)
 * - selected (currently-shown LocationTypeEntry, defaults to first sorted entry)
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
  clearSelection: () => void;
}

export function useLocationTypesPage(campaignId: string): UseLocationTypesPageResult {
  const { data: campaign } = useCampaign(campaignId);
  const locationTypesEnabled = useSectionEnabled(campaignId, 'location_types');

  const { data: types, isLoading: loadingTypes } = useLocationTypes(campaignId);
  const { data: containRules, isLoading: loadingContain } = useContainmentRules();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState('');

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? sorted.filter((t) => t.name.toLowerCase().includes(q)) : sorted;
  }, [sorted, search]);

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
  const clearSelection = () => setSelectedTypeId(null);

  return {
    campaignId,
    campaignTitle: campaign?.title,
    locationTypesEnabled,
    isGm,
    isLoading,
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
    clearSelection,
  };
}
