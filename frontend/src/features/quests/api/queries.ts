import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Quest } from '@/entities/quest';

// ── GraphQL documents ─────────────────────────────────────────────

const QUESTS_QUERY = gql`
  query Quests($campaignId: ID!) {
    quests(campaignId: $campaignId) {
      id
      campaignId
      title
      description
      giverId
      reward
      status
      notes
      createdAt
    }
  }
`;

const QUEST_QUERY = gql`
  query Quest($campaignId: ID!, $id: ID!) {
    quest(campaignId: $campaignId, id: $id) {
      id
      campaignId
      title
      description
      giverId
      reward
      status
      notes
      createdAt
    }
  }
`;

const SAVE_QUEST = gql`
  mutation SaveQuest($campaignId: ID!, $id: ID, $input: QuestInput!) {
    saveQuest(campaignId: $campaignId, id: $id, input: $input) {
      id
      campaignId
      title
      description
      giverId
      reward
      status
      notes
      createdAt
    }
  }
`;

const DELETE_QUEST = gql`
  mutation DeleteQuest($campaignId: ID!, $id: ID!) {
    deleteQuest(campaignId: $campaignId, id: $id)
  }
`;

// ── Helpers ───────────────────────────────────────────────────────

/** Normalise the GraphQL status enum (UPPER_CASE) to the frontend's lowercase type. */
function mapQuest(raw: any): Quest {
  return {
    ...raw,
    status: raw.status?.toLowerCase(),
  };
}

// ── Hooks ─────────────────────────────────────────────────────────

export const useQuests = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(QUESTS_QUERY, {
    variables: { campaignId },
  });
  return {
    data: data?.quests?.map(mapQuest) as Quest[] | undefined,
    isLoading: loading,
    isError: !!error,
  };
};

export const useActiveQuests = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(QUESTS_QUERY, {
    variables: { campaignId },
  });
  const quests = data?.quests?.map(mapQuest) as Quest[] | undefined;
  return {
    data: quests?.filter((q) => q.status === 'active'),
    isLoading: loading,
    isError: !!error,
  };
};

export const useQuest = (campaignId: string, questId: string) => {
  const { data, loading, error } = useQuery<any>(QUEST_QUERY, {
    variables: { campaignId, id: questId },
    skip: !questId,
  });
  return {
    data: data?.quest ? mapQuest(data.quest) as Quest : undefined,
    isLoading: loading,
    isError: !!error,
  };
};

export const useSaveQuest = (campaignId: string) => {
  const [saveQuest, { loading }] = useMutation(SAVE_QUEST, {
    refetchQueries: [{ query: QUESTS_QUERY, variables: { campaignId } }],
  });

  return {
    mutate: (quest: Quest, options?: { onSuccess?: () => void }) => {
      saveQuest({
        variables: {
          campaignId,
          id: quest.id || undefined,
          input: {
            title: quest.title,
            description: quest.description,
            giverId: quest.giverId,
            reward: quest.reward,
            status: quest.status?.toUpperCase(),
            notes: quest.notes,
          },
        },
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useDeleteQuest = (campaignId: string) => {
  const [deleteQuest, { loading }] = useMutation(DELETE_QUEST, {
    refetchQueries: [{ query: QUESTS_QUERY, variables: { campaignId } }],
  });

  return {
    mutate: (id: string, options?: { onSuccess?: () => void }) => {
      deleteQuest({
        variables: { campaignId, id },
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};
