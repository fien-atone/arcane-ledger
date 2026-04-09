import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Species } from '@/entities/species';

const SPECIES_QUERY = gql`
  query Species($campaignId: ID!, $search: String, $type: String) {
    species(campaignId: $campaignId, search: $search, type: $type) {
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

/**
 * Loads the species catalog for a campaign. Supports server-side filtering
 * by `search` (name substring, case-insensitive) and `type` (exact match
 * on the species type id). Uses the flicker-free pattern established by
 * the NPC pilot.
 */
export const useSpecies = (
  campaignId?: string,
  opts?: { search?: string; type?: string },
) => {
  const { data, previousData, loading, error } = useQuery<any>(SPECIES_QUERY, {
    variables: {
      campaignId,
      search: opts?.search?.trim() || null,
      type: opts?.type || null,
    },
    skip: !campaignId,
    notifyOnNetworkStatusChange: true,
  });
  const effective = data ?? previousData;
  const isInitialLoad = loading && !previousData;
  return {
    data: effective?.species as Species[] | undefined,
    isLoading: isInitialLoad,
    isFetching: loading,
    isError: !!error,
    error,
  };
};

export const useSpeciesById = (campaignId?: string, id?: string) => {
  // Always queries the unfiltered list (search/type: null) so callers can
  // look up any species id regardless of any list-page filter that might
  // be active for the same campaign.
  const { data, loading, error } = useQuery<any>(SPECIES_QUERY, {
    variables: { campaignId, search: null, type: null },
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
      }).then(() => opts?.onSuccess?.()).catch(() => {});
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
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
