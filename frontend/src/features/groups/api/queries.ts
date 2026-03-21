import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupRepository } from '@/shared/api/repositories/groupRepository';
import type { Group } from '@/entities/group';

export const useGroups = (campaignId: string) =>
  useQuery({
    queryKey: ['groups', campaignId],
    queryFn: () => groupRepository.list(campaignId),
  });

export const useGroup = (campaignId: string, groupId: string) =>
  useQuery({
    queryKey: ['groups', campaignId, groupId],
    queryFn: () => groupRepository.getById(campaignId, groupId),
    enabled: !!groupId,
  });

export const useSaveGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (group: Group) => groupRepository.save(group),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['groups', saved.campaignId] });
    },
  });
};

export const useDeleteGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, groupId }: { campaignId: string; groupId: string }) =>
      groupRepository.delete(groupId).then(() => ({ campaignId })),
    onSuccess: (_, { campaignId }) => {
      qc.invalidateQueries({ queryKey: ['groups', campaignId] });
    },
  });
};
