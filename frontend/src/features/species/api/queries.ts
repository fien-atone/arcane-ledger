import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Species } from '@/entities/species';

const SPECIES_QUERY = gql`
  query Species($campaignId: ID!) {
    species(campaignId: $campaignId) {
      id campaignId name pluralName type size description traits
    }
  }
`;

const SAVE_SPECIES = gql`
  mutation SaveSpecies(
    $campaignId: ID!, $id: ID, $name: String!, $pluralName: String, $type: String!,
    $size: String!, $description: String, $traits: [String!]
  ) {
    saveSpecies(
      campaignId: $campaignId, id: $id, name: $name, pluralName: $pluralName, type: $type,
      size: $size, description: $description, traits: $traits
    ) {
      id campaignId name pluralName type size description traits
    }
  }
`;

const DELETE_SPECIES = gql`
  mutation DeleteSpecies($id: ID!) {
    deleteSpecies(id: $id)
  }
`;

export const useSpecies = (campaignId?: string) => {
  const { data, loading, error } = useQuery<any>(SPECIES_QUERY, {
    variables: { campaignId },
    skip: !campaignId,
    fetchPolicy: 'cache-and-network',
  });
  return { data: data?.species as Species[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useSpeciesById = (campaignId?: string, id?: string) => {
  const { data, loading, error } = useQuery<any>(SPECIES_QUERY, {
    variables: { campaignId },
    skip: !campaignId || !id,
  });
  const species = id ? (data?.species as Species[] | undefined)?.find((s: Species) => s.id === id) : undefined;
  return { data: species, isLoading: loading, isError: !!error, error };
};

export const useSaveSpecies = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(SAVE_SPECIES);
  return {
    mutate: (species: Species, opts?: { onSuccess?: () => void }) => {
      const { id, createdAt, campaignId: _, ...rest } = species;
      execute({
        variables: { campaignId, id: id || undefined, ...rest },
        refetchQueries: ['Species'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteSpecies = () => {
  const [execute, { loading, error }] = useMutation(DELETE_SPECIES);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: ['Species'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
