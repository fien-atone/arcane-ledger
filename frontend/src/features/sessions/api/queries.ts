import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Session } from '@/entities/session';

// ── GraphQL documents ─────────────────────────────────────────────

const SESSIONS_QUERY = gql`
  query Sessions($campaignId: ID!) {
    sessions(campaignId: $campaignId) {
      id
      campaignId
      number
      title
      datetime
      brief
      summary
      playerVisible
      playerVisibleFields
      createdAt
      npcs { id }
      locations { id }
      quests { id }
    }
  }
`;

const SAVE_SESSION = gql`
  mutation SaveSession($campaignId: ID!, $id: ID, $input: SessionInput!) {
    saveSession(campaignId: $campaignId, id: $id, input: $input) {
      id
      campaignId
      number
      title
      datetime
      brief
      summary
      createdAt
    }
  }
`;

const SET_SESSION_VISIBILITY = gql`
  mutation SetSessionVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
    setSessionVisibility(campaignId: $campaignId, id: $id, input: $input) {
      id playerVisible playerVisibleFields
    }
  }
`;

const DELETE_SESSION = gql`
  mutation DeleteSession($campaignId: ID!, $id: ID!) {
    deleteSession(campaignId: $campaignId, id: $id)
  }
`;

// ── Helpers ───────────────────────────────────────────────────────

/** Map the GraphQL response (which has nested npc/location/quest objects) back
 *  to the flat entity shape the frontend expects (with *Ids arrays). */
function mapSession(raw: any): Session {
  return {
    id: raw.id,
    campaignId: raw.campaignId,
    number: raw.number,
    title: raw.title,
    datetime: raw.datetime,
    brief: raw.brief,
    summary: raw.summary,
    playerVisible: raw.playerVisible ?? false,
    playerVisibleFields: raw.playerVisibleFields ?? [],
    createdAt: raw.createdAt,
    npcIds: raw.npcs?.map((n: any) => n.id),
    locationIds: raw.locations?.map((l: any) => l.id),
    questIds: raw.quests?.map((q: any) => q.id),
  };
}

// ── Hooks ─────────────────────────────────────────────────────────

export const useSessions = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(SESSIONS_QUERY, {
    variables: { campaignId },
  });
  return {
    data: data?.sessions?.map(mapSession) as Session[] | undefined,
    isLoading: loading,
    isError: !!error,
  };
};

export const useLastSession = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(SESSIONS_QUERY, {
    variables: { campaignId },
  });
  const sessions = data?.sessions?.map(mapSession) as Session[] | undefined;
  const last = sessions?.length
    ? sessions.reduce((a, b) => (a.number > b.number ? a : b))
    : undefined;
  return {
    data: last,
    isLoading: loading,
    isError: !!error,
  };
};

export const useSaveSession = (campaignId: string) => {
  const [saveSession, { loading }] = useMutation(SAVE_SESSION, {
    refetchQueries: [{ query: SESSIONS_QUERY, variables: { campaignId } }],
  });

  return {
    mutate: (session: Session, options?: { onSuccess?: () => void }) => {
      saveSession({
        variables: {
          campaignId,
          id: session.id || undefined,
          input: {
            number: session.number,
            title: session.title,
            datetime: session.datetime || undefined,
            brief: session.brief,
            summary: session.summary,
            npcIds: session.npcIds,
            locationIds: session.locationIds,
            questIds: session.questIds,
          },
        },
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useSetSessionVisibility = () => {
  const [execute, { loading }] = useMutation(SET_SESSION_VISIBILITY);
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
        refetchQueries: ['Sessions'],
      });
    },
    isPending: loading,
  };
};

export const useDeleteSession = (campaignId: string) => {
  const [deleteSession, { loading }] = useMutation(DELETE_SESSION, {
    refetchQueries: [{ query: SESSIONS_QUERY, variables: { campaignId } }],
  });

  return {
    mutate: (id: string, options?: { onSuccess?: () => void }) => {
      deleteSession({
        variables: { campaignId, id },
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};
