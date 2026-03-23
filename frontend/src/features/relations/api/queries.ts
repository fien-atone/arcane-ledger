import { useQuery } from '@tanstack/react-query';
import { relationRepository } from '@/shared/api/repositories/relationRepository';

export const useRelationsForEntity = (campaignId: string, entityId: string) =>
  useQuery({
    queryKey: ['relations', campaignId, entityId],
    queryFn: () => relationRepository.listForEntity(campaignId, entityId),
    enabled: !!campaignId && !!entityId,
  });

export const useRelationsForCampaign = (campaignId: string) =>
  useQuery({
    queryKey: ['relations', campaignId],
    queryFn: () => relationRepository.listForCampaign(campaignId),
    enabled: !!campaignId,
  });
