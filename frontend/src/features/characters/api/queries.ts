import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { characterRepository } from '@/shared/api/repositories/characterRepository';
import type { PlayerCharacter } from '@/entities/character';

export const useParty = (campaignId: string) =>
  useQuery({
    queryKey: ['characters', campaignId],
    queryFn: () => characterRepository.list(campaignId),
  });

export const useSaveCharacter = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (character: PlayerCharacter) => characterRepository.save(character),
    onSuccess: (_, character) => {
      qc.invalidateQueries({ queryKey: ['characters', character.campaignId] });
    },
  });
};
