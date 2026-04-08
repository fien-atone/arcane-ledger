/**
 * Page-level state and data for GroupTypesPage.
 *
 * Loads:
 * - The campaign (for the back-link title + role check)
 * - The full list of group types (loaded once, filtered client-side)
 *
 * Owns page-level UI state:
 * - selectedTypeId — which type is currently shown in the right panel
 * - showNew — reserved for future "create new in right panel" flows
 * - search — left-list search filter (client-side only — group type lists
 *   are small and server-side search caused the list to flicker as the
 *   loading state nuked the data on every keystroke)
 *
 * Section widgets receive minimal props and do not re-fetch the type list
 * themselves.
 */
import { useMemo, useState } from 'react';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useGroupTypes } from '@/features/groupTypes/api';
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
  // Load the full list once, no server-side search — group type lists are small
  // and refetching on every keystroke caused the list to flicker.
  const { data: types, isLoading } = useGroupTypes(campaignId);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const allTypes = useMemo(() => {
    const list = types ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((t) => t.name.toLowerCase().includes(q));
  }, [types, search]);

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
