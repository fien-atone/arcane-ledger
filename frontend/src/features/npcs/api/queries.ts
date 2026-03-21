import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { npcRepository } from '@/shared/api/repositories/npcRepository';
import type { NPC } from '@/entities/npc';

export const useNpcs = (campaignId: string) =>
  useQuery({
    queryKey: ['npcs', campaignId],
    queryFn: () => npcRepository.list(campaignId),
  });

export const useNpc = (campaignId: string, npcId: string) =>
  useQuery({
    queryKey: ['npcs', campaignId, npcId],
    queryFn: () => npcRepository.getById(campaignId, npcId),
    enabled: !!npcId,
  });

export const useSaveNpc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (npc: NPC) => npcRepository.save(npc),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['npcs', saved.campaignId] });
    },
  });
};

export const useDeleteNpc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, npcId }: { campaignId: string; npcId: string }) =>
      npcRepository.delete(npcId).then(() => ({ campaignId })),
    onSuccess: (_, { campaignId }) => {
      qc.invalidateQueries({ queryKey: ['npcs', campaignId] });
    },
  });
};
