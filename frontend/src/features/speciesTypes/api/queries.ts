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

/**
 * Loads the species types list for a campaign. Supports server-side name
 * search via the optional `search` field on `opts`.
 *
 * Flicker-free strategy (F-11 sweep, mirrors the NPC pilot): returns
 * `data ?? previousData` so callers keep showing the previous list while
 * the next query is in flight. See `useNpcs` for the full rationale.
 */
export const useSpeciesTypes = (
  campaignId?: string,
  opts?: { search?: string },
) => {
  const { data, previousData, loading, error } = useQuery<any>(SPECIES_TYPES_QUERY, {
    variables: {
      campaignId,
      search: opts?.search?.trim() || null,
    },
    skip: !campaignId,
    notifyOnNetworkStatusChange: true,
  });
  const effective = data ?? previousData;
  const isInitialLoad = loading && !previousData;
  return {
    data: effective?.speciesTypes as SpeciesTypeEntry[] | undefined,
    isLoading: isInitialLoad,
    isFetching: loading,
    isError: !!error,
    error,
  };
};

export const useSaveSpeciesType = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation<any>(SAVE_SPECIES_TYPE);
  return {
    mutate: (entry: SpeciesTypeEntry, opts?: { onSuccess?: (savedId: string) => void }) => {
      execute({
        variables: { campaignId, id: entry.id || undefined, name: entry.name, icon: entry.icon, description: entry.description },
        refetchQueries: ['SpeciesTypes'],
        awaitRefetchQueries: true,
      })
        .then((res) => {
          const savedId: string = res?.data?.saveSpeciesType?.id ?? entry.id ?? '';
          opts?.onSuccess?.(savedId);
        })
        .catch(() => {});
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
