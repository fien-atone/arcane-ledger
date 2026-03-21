import { useQuery } from '@tanstack/react-query';
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
