/**
 * useLinkedEntityList — unified state for linked-entity section widgets.
 *
 * Every "linked entity" section (SessionNpcs, NpcGroupMemberships, …) has
 * the same three pieces of local state: picker open/closed, search filter
 * inside the picker, and an inline remove-confirm id. This hook centralises
 * all three so sections can focus on domain mutations and JSX.
 *
 * Hook only — no JSX. Each section keeps its own picker layout, own
 * visibility toggle, own note editing, etc. Two independent instances in
 * the same component are supported (e.g. GroupMembersSection has separate
 * NPC and character remove-confirm state).
 */
import { useCallback, useMemo, useState } from 'react';
import { useInlineConfirm } from '@/shared/ui';

export interface UseLinkedEntityListOptions<TLinked, TCandidate> {
  linked: TLinked[];
  candidates: TCandidate[];
  getCandidateId: (c: TCandidate) => string;
  getCandidateSearchText: (c: TCandidate) => string;
  /** Override default "already linked" check when linkage is more than id. */
  isLinked?: (candidate: TCandidate, linked: TLinked[]) => boolean;
  /** How to project a linked item to the id that matches a candidate id.
   *  Ignored when a custom `isLinked` is provided. Defaults to `l.id`. */
  getLinkedId?: (l: TLinked) => string;
}

export interface UseLinkedEntityListResult<TCandidate> {
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
  search: string;
  setSearch: (v: string) => void;
  /** Candidates that pass search AND are not already linked. Memoised. */
  availableFiltered: TCandidate[];
  confirmRemoveId: string | null;
  askRemove: (id: string) => void;
  cancelRemove: () => void;
  isAskingRemove: (id: string) => boolean;
}

export function useLinkedEntityList<TLinked, TCandidate>(
  options: UseLinkedEntityListOptions<TLinked, TCandidate>,
): UseLinkedEntityListResult<TCandidate> {
  const {
    linked,
    candidates,
    getCandidateId,
    getCandidateSearchText,
    isLinked,
    getLinkedId,
  } = options;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const confirm = useInlineConfirm<string>();

  const openPicker = useCallback(() => setPickerOpen(true), []);
  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setSearch('');
  }, []);

  const availableFiltered = useMemo(() => {
    const check =
      isLinked ??
      ((c: TCandidate, ls: TLinked[]) => {
        const project = getLinkedId ?? ((l: TLinked) => (l as unknown as { id: string }).id);
        const cid = getCandidateId(c);
        return ls.some((l) => project(l) === cid);
      });
    const needle = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (check(c, linked)) return false;
      if (!needle) return true;
      return getCandidateSearchText(c).toLowerCase().includes(needle);
    });
  }, [candidates, linked, search, isLinked, getLinkedId, getCandidateId, getCandidateSearchText]);

  return {
    pickerOpen,
    openPicker,
    closePicker,
    search,
    setSearch,
    availableFiltered,
    confirmRemoveId: confirm.pendingId,
    askRemove: confirm.ask,
    cancelRemove: confirm.cancel,
    isAskingRemove: confirm.isAsking,
  };
}
