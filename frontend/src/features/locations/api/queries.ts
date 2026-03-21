import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationRepository } from '@/shared/api/repositories/locationRepository';
import type { Location } from '@/entities/location';

export const useLocations = (campaignId: string) =>
  useQuery({
    queryKey: ['locations', campaignId],
    queryFn: () => locationRepository.list(campaignId),
  });

export const useLocation = (campaignId: string, locationId: string) =>
  useQuery({
    queryKey: ['locations', campaignId, locationId],
    queryFn: () => locationRepository.getById(campaignId, locationId),
    enabled: !!locationId,
  });

export const useSaveLocation = (campaignId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (loc: Location) => locationRepository.save(loc),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['locations', campaignId] });
      qc.invalidateQueries({ queryKey: ['locations', campaignId, saved.id] });
    },
  });
};
