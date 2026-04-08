/**
 * Page-level state for CampaignsPage — the cross-campaign landing page.
 *
 * Loads all campaigns, splits them into active (GM-first, then title) and
 * archived buckets, and owns the Create-campaign drawer open state. Section
 * widgets (hero, active list, archived list, calendar) receive the already
 * split lists via props; the global calendar section still fetches its own
 * session data per campaign to preserve the existing behavior.
 */
import { useMemo, useState } from 'react';
import { useCampaigns } from '@/features/campaigns/api/queries';
import type { CampaignSummary } from '@/entities/campaign';

export interface UseCampaignsListPageResult {
  campaigns: CampaignSummary[] | undefined;
  isLoading: boolean;
  isError: boolean;
  active: CampaignSummary[];
  archived: CampaignSummary[];
  createOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
}

export function useCampaignsListPage(): UseCampaignsListPageResult {
  const { data: campaigns, isLoading, isError } = useCampaigns();
  const [createOpen, setCreateOpen] = useState(false);

  const active = useMemo(
    () =>
      (campaigns ?? [])
        .filter((c) => !c.archivedAt)
        .sort((a, b) => {
          const aGm = a.myRole.toUpperCase() === 'GM' ? 0 : 1;
          const bGm = b.myRole.toUpperCase() === 'GM' ? 0 : 1;
          if (aGm !== bGm) return aGm - bGm;
          return a.title.localeCompare(b.title);
        }),
    [campaigns],
  );

  const archived = useMemo(
    () => (campaigns ?? []).filter((c) => !!c.archivedAt),
    [campaigns],
  );

  return {
    campaigns,
    isLoading,
    isError,
    active,
    archived,
    createOpen,
    openCreate: () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
  };
}
