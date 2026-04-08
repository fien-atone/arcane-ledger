/**
 * Page-level state and data for GroupTypesPage.
 *
 * Loads:
 * - The campaign (for the back-link title + role check)
 * - The filtered list of group types (driven by debounced search)
 *
 * Owns page-level UI state:
 * - selectedTypeId — which type is currently shown in the right panel
 * - showNew — reserved for future "create new in right panel" flows
 * - search — left-list search filter
 *
 * Derives:
 * - types (already server-filtered via useGroupTypes(search))
 * - selected (currently-shown GroupTypeEntry, defaults to first entry)
 *
 * Section widgets receive minimal props and do not re-fetch the type list
 * themselves.
 */
import { useState } from 'react';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useGroupTypes } from '@/features/groupTypes/api';
import { useDebouncedValue } from '@/shared/lib/useDebouncedValue';
import type { GroupTypeEntry } from '@/entities/groupType';

export interface UseGroupTypesPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  groupTypesEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
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

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const { data: types, isLoading } = useGroupTypes(campaignId, debouncedSearch);

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
