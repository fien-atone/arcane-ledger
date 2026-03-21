import { useQuery } from '@tanstack/react-query';
import { sessionRepository } from '@/shared/api/repositories/sessionRepository';

export const useSessions = (campaignId: string) =>
  useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => sessionRepository.list(campaignId),
  });

export const useLastSession = (campaignId: string) =>
  useQuery({
    queryKey: ['sessions', campaignId, 'last'],
    queryFn: () => sessionRepository.getLast(campaignId),
  });
