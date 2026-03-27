import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { relationRepository } from '@/shared/api/repositories/relationRepository';
import type { Relation } from '@/entities/relation';

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

export const useSaveRelation = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (relation: Relation) => relationRepository.save(relation),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relations', campaignId] });
    },
  });
};

export const useDeleteRelation = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => relationRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['relations', campaignId] });
    },
  });
};
