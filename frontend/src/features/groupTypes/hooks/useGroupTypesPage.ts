/**
 * Page-level state and data for GroupTypesPage.
 *
 * Loads:
 * - The campaign (for the back-link title + role check)
 * - The (server-filtered) list of group types — search is debounced
 *   and pushed into the GraphQL variable; the list returned by
 *   `useGroupTypes` already has the filter applied.
 *
 * F-11 sweep: search is SERVER-SIDE. The hook uses `useDebouncedSearch`
 * (300 ms) to drive the query variable, and relies on Apollo v4
 * `previousData` inside `useGroupTypes` to keep the existing list
 * visible while the new query is in flight (no list flicker).
 *
 * Owns page-level UI state:
 * - selectedTypeId — which type is currently shown in the right panel
 * - showNew — whether the right panel is in "create new type" mode
 * - search — left-list search filter
 *
 * Section widgets receive minimal props and do not re-fetch the type list
 * themselves.
 */
import { useState } from 'react';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useGroupTypes } from '@/features/groupTypes/api';
import { useDebouncedSearch } from '@/shared/hooks';
import type { GroupTypeEntry } from '@/entities/groupType';

export interface UseGroupTypesPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  groupTypesEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isFetching: boolean;
  types: GroupTypeEntry[];
  selected: GroupTypeEntry | null;
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

export function useGroupTypesPage(campaignId: string): UseGroupTypesPageResult {
  const { data: campaign } = useCampaign(campaignId);
  const groupTypesEnabled = useSectionEnabled(campaignId, 'group_types');

  // Local-state debounced search. The input value updates immediately;
  // the debounced value drives the GraphQL variable.
  const {
    value: search,
    debouncedValue: debouncedSearch,
    setValue: setSearch,
  } = useDebouncedSearch('', 300);

  const {
    data: types,
    isLoading,
    isFetching,
  } = useGroupTypes(campaignId, { search: debouncedSearch || undefined });

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

  /** Called after a new type is successfully saved — closes the form and
   *  selects the newly created type so the user lands on its edit card. */
  const finishCreate = (savedId: string) => {
    setShowNew(false);
    setSelectedTypeId(savedId);
  };

  const clearSelection = () => setSelectedTypeId(null);

  return {
    campaignId,
    campaignTitle: campaign?.title,
    groupTypesEnabled,
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
