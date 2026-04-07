import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { SpeciesTypeEntry } from '@/entities/speciesType';

const SPECIES_TYPES_QUERY = gql`
  query SpeciesTypes($campaignId: ID!, $search: String) {
    speciesTypes(campaignId: $campaignId, search: $search) {
      id campaignId name icon description
    }
  }
`;

const SAVE_SPECIES_TYPE = gql`
  mutation SaveSpeciesType($campaignId: ID!, $id: ID, $name: String!, $icon: String, $description: String) {
    saveSpeciesType(campaignId: $campaignId, id: $id, name: $name, icon: $icon, description: $description) {
      id campaignId name icon description
    }
  }
`;

const DELETE_SPECIES_TYPE = gql`
  mutation DeleteSpeciesType($id: ID!) {
    deleteSpeciesType(id: $id)
  }
`;

export const useSpeciesTypes = (campaignId?: string, search?: string) => {
  const { data, loading, error } = useQuery<any>(SPECIES_TYPES_QUERY, {
    variables: { campaignId, search: search?.trim() || null },
    skip: !campaignId,
  });
  return { data: data?.speciesTypes as SpeciesTypeEntry[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveSpeciesType = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(SAVE_SPECIES_TYPE);
  return {
    mutate: (entry: SpeciesTypeEntry, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { campaignId, id: entry.id || undefined, name: entry.name, icon: entry.icon, description: entry.description },
        refetchQueries: ['SpeciesTypes'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteSpeciesType = () => {
  const [execute, { loading, error }] = useMutation(DELETE_SPECIES_TYPE);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: ['SpeciesTypes'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
