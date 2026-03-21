import { useQuery } from '@tanstack/react-query';
import { questRepository } from '@/shared/api/repositories/questRepository';

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
