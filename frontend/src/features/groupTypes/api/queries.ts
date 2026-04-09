import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { GroupTypeEntry } from '@/entities/groupType';

const GROUP_TYPES_QUERY = gql`
  query GroupTypes($campaignId: ID!, $search: String) {
    groupTypes(campaignId: $campaignId, search: $search) {
      id campaignId name icon description
    }
  }
`;

const SAVE_GROUP_TYPE = gql`
  mutation SaveGroupType($campaignId: ID!, $id: ID, $name: String!, $icon: String, $description: String) {
    saveGroupType(campaignId: $campaignId, id: $id, name: $name, icon: $icon, description: $description) {
      id campaignId name icon description
    }
  }
`;

const DELETE_GROUP_TYPE = gql`
  mutation DeleteGroupType($id: ID!) {
    deleteGroupType(id: $id)
  }
`;

/**
 * Loads the group types list for a campaign. Supports server-side name
 * search via the optional `search` field on `opts`.
 *
 * Flicker-free strategy (F-11 sweep, mirrors the NPC pilot):
 *  - `notifyOnNetworkStatusChange: true` makes Apollo emit loading states
 *    on variable changes, not just initial fetch.
 *  - We return `data ?? previousData` so the caller keeps rendering the
 *    previous list while the new query is in flight.
 *  - `isLoading` is only true on the very first load (no previous data).
 *  - `isFetching` stays true for every in-flight request so the global
 *    loading bar still moves on each keystroke.
 */
export const useGroupTypes = (
  campaignId?: string,
  opts?: { search?: string },
) => {
  const { data, previousData, loading, error } = useQuery<any>(GROUP_TYPES_QUERY, {
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
    data: effective?.groupTypes as GroupTypeEntry[] | undefined,
    isLoading: isInitialLoad,
    isFetching: loading,
    isError: !!error,
    error,
  };
};

export const useSaveGroupType = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation<any>(SAVE_GROUP_TYPE);
  return {
    mutate: (entry: GroupTypeEntry, opts?: { onSuccess?: (savedId: string) => void }) => {
      execute({
        variables: {
          campaignId,
          id: entry.id || undefined,
          name: entry.name,
          icon: entry.icon,
          description: entry.description,
        },
        refetchQueries: ['GroupTypes'],
        awaitRefetchQueries: true,
      })
        .then((res) => {
          const savedId: string = res?.data?.saveGroupType?.id ?? entry.id ?? '';
          opts?.onSuccess?.(savedId);
        })
        .catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteGroupType = () => {
  const [execute, { loading, error }] = useMutation(DELETE_GROUP_TYPE);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: ['GroupTypes'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
