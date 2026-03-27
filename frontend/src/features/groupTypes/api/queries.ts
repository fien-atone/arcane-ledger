import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { GroupTypeEntry } from '@/entities/groupType';

// ── Queries ──────────────────────────────────────────────────────────────────

const GROUP_TYPES_QUERY = gql`
  query GroupTypes {
    groupTypes {
      id name icon
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_GROUP_TYPE = gql`
  mutation SaveGroupType($id: ID, $name: String!, $icon: String) {
    saveGroupType(id: $id, name: $name, icon: $icon) {
      id name icon
    }
  }
`;

const DELETE_GROUP_TYPE = gql`
  mutation DeleteGroupType($id: ID!) {
    deleteGroupType(id: $id)
  }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useGroupTypes = () => {
  const { data, loading, error } = useQuery<any>(GROUP_TYPES_QUERY);
  return { data: data?.groupTypes as GroupTypeEntry[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveGroupType = () => {
  const [execute, { loading, error }] = useMutation(SAVE_GROUP_TYPE);
  return {
    mutate: (entry: GroupTypeEntry, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id: entry.id, name: entry.name, icon: entry.icon },
        refetchQueries: [{ query: GROUP_TYPES_QUERY }],
      }).then(() => opts?.onSuccess?.());
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
        refetchQueries: [{ query: GROUP_TYPES_QUERY }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
