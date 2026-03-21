import { useQuery } from '@tanstack/react-query';
import { factionRepository } from '@/shared/api/repositories/factionRepository';

export const useFactions = (campaignId: string) =>
  useQuery({
    queryKey: ['factions', campaignId],
    queryFn: () => factionRepository.list(campaignId),
  });

export const useFaction = (campaignId: string, factionId: string) =>
  useQuery({
    queryKey: ['factions', campaignId, factionId],
    queryFn: () => factionRepository.getById(campaignId, factionId),
    enabled: !!factionId,
  });
