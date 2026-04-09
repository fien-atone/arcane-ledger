/**
 * Page-level state and data for QuestListPage (Tier 2 list page).
 *
 * F-11: search and status filtering are SERVER-SIDE. This hook:
 *
 *  - Reads `?q` and `?status` from the URL
 *  - Drives the <input> off a local debounced state (300 ms)
 *  - Passes the debounced search + uppercase status to `useQuests`, which
 *    uses Apollo v4's `previousData` to keep the existing list visible
 *    during refetches (no list flicker).
 *  - Removes the client-side `useMemo` filter — the list returned from
 *    the query is already filtered by the server.
 *
 * Status-filter chip counts: removed for the F-11 pilot. The server
 * returns the filtered list, so counts per status are no longer directly
 * available. Re-adding them would require a second aggregation query —
 * deferred.
 *
 * Loads:
 * - The campaign (for the title + GM role check)
 * - The (server-filtered) list of quests for the campaign
 *
 * Owns the page-level UI state:
 * - URL search params (q, status) — mirrored into search + statusFilter
 * - addOpen — whether the "add quest" drawer is open
 */
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useQuests, useSetQuestVisibility } from '@/features/quests/api';
import { useDebouncedSearch } from '@/shared/hooks';
import type { Quest, QuestStatus } from '@/entities/quest';

export type StatusFilterValue = QuestStatus | 'all';

export interface StatusFilterOption {
  value: StatusFilterValue;
  label: string;
}

const STATUS_FILTER_KEYS: StatusFilterValue[] = [
  'all',
  'active',
  'undiscovered',
  'completed',
  'unavailable',
  'failed',
];

export interface UseQuestListPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  questsEnabled: boolean;
  partyEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** Server-filtered list. Stays populated via Apollo previousData during
   *  in-flight refetches. */
  quests: Quest[] | undefined;
  statusFilters: StatusFilterOption[];
  search: string;
  setSearch: (v: string) => void;
  statusFilter: StatusFilterValue;
  setStatusFilter: (v: StatusFilterValue) => void;
  addOpen: boolean;
  openAdd: () => void;
  closeAdd: () => void;
  toggleVisibility: (quest: Quest) => void;
}

export function useQuestListPage(campaignId: string): UseQuestListPageResult {
  const { t } = useTranslation('quests');
  const questsEnabled = useSectionEnabled(campaignId, 'quests');
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const { data: campaign } = useCampaign(campaignId);
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilterValue;

  const { value: search, debouncedValue: debouncedSearch, setValue: setDebouncedSearch } =
    useDebouncedSearch(urlSearch, 300);

  const statusForQuery = statusFilter === 'all' ? undefined : statusFilter.toUpperCase();

  const { data: quests, isLoading, isFetching, isError } = useQuests(campaignId, {
    search: debouncedSearch || undefined,
    status: statusForQuery,
  });
  const setQuestVisibility = useSetQuestVisibility();

  const [addOpen, setAddOpen] = useState(false);

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

  const setStatusFilter = useCallback(
    (val: StatusFilterValue) => {
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
    return STATUS_FILTER_KEYS.map((value) => ({
      value,
      label: value === 'all' ? t('filter_all') : t(`status_${value}`),
    }));
  }, [t]);

  const toggleVisibility = useCallback(
    (quest: Quest) => {
      setQuestVisibility.mutate({
        campaignId,
        id: quest.id,
        playerVisible: !quest.playerVisible,
        playerVisibleFields: quest.playerVisibleFields ?? [],
      });
    },
    [campaignId, setQuestVisibility],
  );

  return {
    campaignId,
    campaignTitle: campaign?.title,
    questsEnabled,
    partyEnabled,
    isGm,
    isLoading,
    isFetching,
    isError,
    quests,
    statusFilters,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    addOpen,
    openAdd: () => setAddOpen(true),
    closeAdd: () => setAddOpen(false),
    toggleVisibility,
  };
}
