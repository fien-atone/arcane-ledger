import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questRepository } from '@/shared/api/repositories/questRepository';
import type { Quest } from '@/entities/quest';

export const useQuests = (campaignId: string) =>
  useQuery({
    queryKey: ['quests', campaignId],
    queryFn: () => questRepository.list(campaignId),
  });

export const useActiveQuests = (campaignId: string) =>
  useQuery({
    queryKey: ['quests', campaignId, 'active'],
    queryFn: () => questRepository.getActive(campaignId),
  });

export const useQuest = (campaignId: string, questId: string) =>
  useQuery({
    queryKey: ['quests', campaignId, questId],
    queryFn: () => questRepository.getById(campaignId, questId),
    enabled: !!questId,
  });

export const useSaveQuest = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (quest: Quest) => questRepository.save(quest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests', campaignId] });
    },
  });
};

export const useDeleteQuest = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => questRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests', campaignId] });
    },
  });
};
