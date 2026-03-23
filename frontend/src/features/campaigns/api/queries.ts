import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignRepository } from '@/shared/api/repositories/campaignRepository';

export const useCampaigns = () =>
  useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignRepository.list(),
  });

export const useCampaign = (id: string) =>
  useQuery({
    queryKey: ['campaigns', id],
    queryFn: () => campaignRepository.getById(id),
    enabled: !!id,
  });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaign: import('@/entities/campaign').CampaignSummary) =>
      campaignRepository.save(campaign),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
};
