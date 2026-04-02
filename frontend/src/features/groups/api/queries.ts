import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Group } from '@/entities/group';

// ── Queries ──────────────────────────────────────────────────────────────────

const GROUPS_QUERY = gql`
  query Groups($campaignId: ID!, $search: String, $type: String) {
    groups(campaignId: $campaignId, search: $search, type: $type) {
      id campaignId name type aliases description goals symbols
      gmNotes playerVisible playerVisibleFields
      createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

const GROUP_QUERY = gql`
  query Group($campaignId: ID!, $id: ID!) {
    group(campaignId: $campaignId, id: $id) {
      id campaignId name type aliases description goals symbols
      gmNotes playerVisible playerVisibleFields
      createdAt updatedAt
      members { groupId relation subfaction }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_GROUP = gql`
  mutation SaveGroup($campaignId: ID!, $id: ID, $input: GroupInput!) {
    saveGroup(campaignId: $campaignId, id: $id, input: $input) {
      id campaignId name type aliases description goals symbols
      gmNotes  createdAt updatedAt
    }
  }
`;

const SET_GROUP_VISIBILITY = gql`
  mutation SetGroupVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
    setGroupVisibility(campaignId: $campaignId, id: $id, input: $input) {
      id playerVisible playerVisibleFields
    }
  }
`;

const DELETE_GROUP = gql`
  mutation DeleteGroup($campaignId: ID!, $id: ID!) {
    deleteGroup(campaignId: $campaignId, id: $id)
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapGroup(raw: any): Group {
  return {
    ...raw,
    playerVisible: raw.playerVisible ?? false,
    playerVisibleFields: raw.playerVisibleFields ?? [],
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useGroups = (campaignId: string, opts?: { search?: string; type?: string }) => {
  const { data, loading, error } = useQuery<any>(GROUPS_QUERY, {
    variables: { campaignId, search: opts?.search?.trim() || null, type: opts?.type || null },
    fetchPolicy: 'cache-and-network',
  });
  return { data: data?.groups?.map(mapGroup) as Group[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useGroup = (campaignId: string, groupId: string) => {
  const { data, loading, error } = useQuery<any>(GROUP_QUERY, {
    variables: { campaignId, id: groupId },
    skip: !groupId,
  });
  return { data: data?.group ? mapGroup(data.group) as Group : undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveGroup = () => {
  const [execute, { loading, error }] = useMutation(SAVE_GROUP);
  return {
    mutate: (group: Group, opts?: { onSuccess?: () => void }) => {
      const input = {
        name: group.name,
        type: group.type,
        aliases: group.aliases,
        description: group.description,
        goals: group.goals,
        symbols: group.symbols,
        gmNotes: group.gmNotes,
      };
      execute({
        variables: { campaignId: group.campaignId, id: group.id || undefined, input },
        refetchQueries: ['Groups'],
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
        refetchQueries: ['Groups'],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useSetGroupVisibility = () => {
  const [execute, { loading }] = useMutation(SET_GROUP_VISIBILITY);
  return {
    mutate: (
      vars: { campaignId: string; id: string; playerVisible: boolean; playerVisibleFields: string[] },
    ) => {
      execute({
        variables: {
          campaignId: vars.campaignId,
          id: vars.id,
          input: { playerVisible: vars.playerVisible, playerVisibleFields: vars.playerVisibleFields },
        },
        refetchQueries: 'active',
      });
    },
    isPending: loading,
  };
};
