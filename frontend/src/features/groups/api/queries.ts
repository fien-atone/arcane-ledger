import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Group } from '@/entities/group';

// ── Queries ──────────────────────────────────────────────────────────────────

const GROUPS_QUERY = gql`
  query Groups($campaignId: ID!) {
    groups(campaignId: $campaignId) {
      id campaignId name type aliases description goals symbols
      gmNotes partyRelation createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

const GROUP_QUERY = gql`
  query Group($campaignId: ID!, $id: ID!) {
    group(campaignId: $campaignId, id: $id) {
      id campaignId name type aliases description goals symbols
      gmNotes partyRelation createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_GROUP = gql`
  mutation SaveGroup($campaignId: ID!, $id: ID, $input: GroupInput!) {
    saveGroup(campaignId: $campaignId, id: $id, input: $input) {
      id campaignId name type aliases description goals symbols
      gmNotes partyRelation createdAt updatedAt
    }
  }
`;

const DELETE_GROUP = gql`
  mutation DeleteGroup($campaignId: ID!, $id: ID!) {
    deleteGroup(campaignId: $campaignId, id: $id)
  }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useGroups = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(GROUPS_QUERY, {
    variables: { campaignId },
  });
  return { data: data?.groups as Group[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useGroup = (campaignId: string, groupId: string) => {
  const { data, loading, error } = useQuery<any>(GROUP_QUERY, {
    variables: { campaignId, id: groupId },
    skip: !groupId,
  });
  return { data: data?.group as Group | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveGroup = () => {
  const [execute, { loading, error }] = useMutation(SAVE_GROUP);
  return {
    mutate: (group: Group, opts?: { onSuccess?: () => void }) => {
      const { id, campaignId, createdAt, updatedAt, ...rest } = group;
      execute({
        variables: { campaignId, id, input: rest },
        refetchQueries: [{ query: GROUPS_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteGroup = () => {
  const [execute, { loading, error }] = useMutation(DELETE_GROUP);
  return {
    mutate: (
      { campaignId, groupId }: { campaignId: string; groupId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: { campaignId, id: groupId },
        refetchQueries: [{ query: GROUPS_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
