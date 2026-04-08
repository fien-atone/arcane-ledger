/**
 * Page-level state and handlers for CampaignDashboardPage.
 *
 * Loads the root campaign entity, derives role + enabled-section flags, and
 * exposes shared mutation handlers (save title, save description, toggle
 * archive). The dashboard widgets fetch their own data — this hook does NOT
 * pre-load sessions/npcs/locations/quests/party/groups.
 */
import { useCallback, useMemo, useState } from 'react';
import {
  useCampaign,
  useSaveCampaign,
  getEnabledSections,
} from '@/features/campaigns/api/queries';
import type { CampaignSection, CampaignSummary } from '@/entities/campaign';

export interface UseCampaignDashboardResult {
  campaignId: string;
  campaign: CampaignSummary | undefined;
  isLoading: boolean;
  isGm: boolean;
  sectionOn: (section: CampaignSection) => boolean;

  // header state
  editingTitle: boolean;
  titleDraft: string;
  setTitleDraft: (v: string) => void;
  startEditTitle: () => void;
  commitTitle: () => void;
  cancelEditTitle: () => void;

  // archive confirm
  confirmArchive: boolean;
  setConfirmArchive: (v: boolean) => void;
  toggleArchive: () => void;

  // manage sections drawer
  sectionsOpen: boolean;
  setSectionsOpen: (v: boolean) => void;

  // description
  saveDescription: (html: string) => void;
}

export function useCampaignDashboard(campaignId: string): UseCampaignDashboardResult {
  const { data: campaign, isLoading } = useCampaign(campaignId);
  const saveCampaign = useSaveCampaign();

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const enabledSet = useMemo(
    () => new Set(getEnabledSections(campaign)),
    [campaign],
  );
  const sectionOn = useCallback(
    (s: CampaignSection) => enabledSet.has(s),
    [enabledSet],
  );

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const startEditTitle = useCallback(() => {
    if (!campaign) return;
    setTitleDraft(campaign.title);
    setEditingTitle(true);
  }, [campaign]);

  const commitTitle = useCallback(() => {
    if (!campaign) return;
    const next = titleDraft.trim();
    if (next) {
      saveCampaign.mutate({ ...(campaign as CampaignSummary), title: next });
    }
    setEditingTitle(false);
  }, [campaign, titleDraft, saveCampaign]);

  const cancelEditTitle = useCallback(() => {
    setEditingTitle(false);
  }, []);

  const toggleArchive = useCallback(() => {
    if (!campaign) return;
    saveCampaign.mutate({
      ...(campaign as CampaignSummary),
      archivedAt: campaign.archivedAt ? undefined : new Date().toISOString(),
    });
    setConfirmArchive(false);
  }, [campaign, saveCampaign]);

  const saveDescription = useCallback(
    (html: string) => {
      if (!campaign) return;
      saveCampaign.mutate({
        ...(campaign as CampaignSummary),
        description: html || undefined,
      });
    },
    [campaign, saveCampaign],
  );

  return {
    campaignId,
    campaign,
    isLoading,
    isGm,
    sectionOn,
    editingTitle,
    titleDraft,
    setTitleDraft,
    startEditTitle,
    commitTitle,
    cancelEditTitle,
    confirmArchive,
    setConfirmArchive,
    toggleArchive,
    sectionsOpen,
    setSectionsOpen,
    saveDescription,
  };
}
