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

export const useGroupTypes = (campaignId?: string, search?: string) => {
  const { data, loading, error } = useQuery<any>(GROUP_TYPES_QUERY, {
    variables: { campaignId, search: search?.trim() || null },
    skip: !campaignId,
  });
  return { data: data?.groupTypes as GroupTypeEntry[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveGroupType = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(SAVE_GROUP_TYPE);
  return {
    mutate: (entry: GroupTypeEntry, opts?: { onSuccess?: () => void }) => {
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
      }).then(() => opts?.onSuccess?.()).catch(() => {});
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
