/**
 * Page-level state and handlers for QuestDetailPage.
 *
 * Loads the root Quest entity, derives role/section flags from the campaign,
 * and exposes shared callbacks (field save, status change, delete).
 *
 * Section widgets fetch their own additional data — this hook deliberately
 * does NOT pre-load linked NPCs / sessions.
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest, useSaveQuest, useDeleteQuest } from '@/features/quests/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import type { Quest, QuestStatus } from '@/entities/quest';

export interface UseQuestDetailResult {
  quest: Quest | undefined;
  isLoading: boolean;
  isError: boolean;
  campaignTitle: string | undefined;
  isGm: boolean;
  questsEnabled: boolean;
  npcsEnabled: boolean;
  sessionsEnabled: boolean;
  partyEnabled: boolean;
  saveField: (field: keyof Quest, html: string) => void;
  changeStatus: (status: QuestStatus) => void;
  handleDelete: () => void;
  isDeletePending: boolean;
}

export function useQuestDetail(campaignId: string, questId: string): UseQuestDetailResult {
  const questsEnabled = useSectionEnabled(campaignId, 'quests');
  const npcsEnabled = useSectionEnabled(campaignId, 'npcs');
  const sessionsEnabled = useSectionEnabled(campaignId, 'sessions');
  const partyEnabled = useSectionEnabled(campaignId, 'party');

  const { data: campaign } = useCampaign(campaignId);
  const { data: quest, isLoading, isError } = useQuest(campaignId, questId);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';

  const saveQuest = useSaveQuest(campaignId);
  const deleteQuest = useDeleteQuest(campaignId);
  const navigate = useNavigate();

  const saveField = useCallback(
    (field: keyof Quest, html: string) => {
      if (!quest) return;
      saveQuest.mutate({ ...quest, [field]: html || undefined });
    },
    [quest, saveQuest],
  );

  const changeStatus = useCallback(
    (status: QuestStatus) => {
      if (!quest) return;
      saveQuest.mutate({ ...quest, status });
    },
    [quest, saveQuest],
  );

  const handleDelete = useCallback(() => {
    if (!quest) return;
    deleteQuest.mutate(quest.id, {
      onSuccess: () => navigate(`/campaigns/${campaignId}/quests`),
    });
  }, [campaignId, quest, deleteQuest, navigate]);

  return {
    quest,
    isLoading,
    isError,
    campaignTitle: campaign?.title,
    isGm,
    questsEnabled,
    npcsEnabled,
    sessionsEnabled,
    partyEnabled,
    saveField,
    changeStatus,
    handleDelete,
    isDeletePending: deleteQuest.isPending,
  };
}
