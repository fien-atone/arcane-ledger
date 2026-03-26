import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionRepository } from '@/shared/api/repositories/sessionRepository';
import type { Session } from '@/entities/session';

export const useSessions = (campaignId: string) =>
  useQuery({
    queryKey: ['sessions', campaignId],
    queryFn: () => sessionRepository.list(campaignId),
  });

export const useSaveSession = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (session: Session) => sessionRepository.save(session),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', campaignId] }),
  });
};

export const useDeleteSession = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', campaignId] }),
  });
};

export const useLastSession = (campaignId: string) =>
  useQuery({
    queryKey: ['sessions', campaignId, 'last'],
    queryFn: () => sessionRepository.getLast(campaignId),
  });
