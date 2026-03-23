import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupTypeRepository } from '@/shared/api/repositories/groupTypeRepository';
import type { GroupTypeEntry } from '@/entities/groupType';

export const useGroupTypes = () =>
  useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => groupTypeRepository.list(),
    staleTime: Infinity,
  });

export const useSaveGroupType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: GroupTypeEntry) => groupTypeRepository.save(entry),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groupTypes'] }),
  });
};

export const useDeleteGroupType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => groupTypeRepository.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groupTypes'] }),
  });
};
