/**
 * Page-level state and data for QuestListPage (Tier 2 list page).
 *
 * Loads:
 * - The campaign (for the title in the back link + GM role check)
 * - The full list of quests for the campaign
 *
 * Owns the page-level UI state:
 * - URL search params (q, status) — mirrored into search + statusFilter
 * - addOpen — whether the "add quest" drawer is open
 *
 * Derives:
 * - statusFilters (all + each QuestStatus with counts)
 * - filtered (client-side search + status filter applied)
 *
 * Matches the list-page pattern established by useGroupListPage /
 * useNpcListPage: the hook owns shared state and hands minimal props down
 * to presentational section widgets. Filtering is client-side.
 */
import { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCampaign,
  useSectionEnabled,
} from '@/features/campaigns/api/queries';
import { useQuests, useSetQuestVisibility } from '@/features/quests/api';
import type { Quest, QuestStatus } from '@/entities/quest';

export type StatusFilterValue = QuestStatus | 'all';

export interface StatusFilterOption {
  value: StatusFilterValue;
  label: string;
  count: number;
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
  isError: boolean;
  quests: Quest[] | undefined;
  filtered: Quest[];
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

  const { data: quests, isLoading, isError } = useQuests(campaignId);
  const setQuestVisibility = useSetQuestVisibility();

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilterValue;

  const [addOpen, setAddOpen] = useState(false);

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
      count:
        value === 'all'
          ? quests?.length ?? 0
          : quests?.filter((q) => q.status === value).length ?? 0,
    }));
  }, [quests, t]);

  const filtered = useMemo(() => {
    if (!quests) return [];
    const q = search.trim().toLowerCase();
    return quests.filter((quest) => {
      const matchStatus =
        statusFilter === 'all' || quest.status === statusFilter;
      const matchSearch =
        !q ||
        quest.title.toLowerCase().includes(q) ||
        quest.description.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [quests, search, statusFilter]);

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
    isError,
    quests,
    filtered,
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
