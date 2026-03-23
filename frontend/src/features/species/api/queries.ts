import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { speciesRepository } from '@/shared/api/repositories/speciesRepository';
import type { Species } from '@/entities/species';

export const useSpecies = () =>
  useQuery({
    queryKey: ['species'],
    queryFn: () => speciesRepository.list(),
    staleTime: Infinity,
  });

export const useSpeciesById = (id?: string) =>
  useQuery({
    queryKey: ['species', id],
    queryFn: () => speciesRepository.getById(id!),
    enabled: !!id,
    staleTime: Infinity,
  });

export const useSaveSpecies = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (species: Species) => speciesRepository.save(species),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['species'] }),
  });
};

export const useDeleteSpecies = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => speciesRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['species'] }),
  });
};
