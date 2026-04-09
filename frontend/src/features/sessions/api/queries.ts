import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Session } from '@/entities/session';

// ── GraphQL documents ─────────────────────────────────────────────

const SESSIONS_QUERY = gql`
  query Sessions($campaignId: ID!, $search: String) {
    sessions(campaignId: $campaignId, search: $search) {
      id
      campaignId
      number
      title
      datetime
      brief
      summary
      createdAt
      npcs { id name status species image playerVisible playerVisibleFields }
      locations { id name type playerVisible playerVisibleFields }
      quests { id title status playerVisible playerVisibleFields }
      myNote { id content updatedAt }
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
      npcs { id name status species image playerVisible playerVisibleFields }
      locations { id name type playerVisible playerVisibleFields }
      quests { id title status playerVisible playerVisibleFields }
      myNote { id content updatedAt }
    }
  }
`;

const DELETE_SESSION = gql`
  mutation DeleteSession($campaignId: ID!, $id: ID!) {
    deleteSession(campaignId: $campaignId, id: $id)
  }
`;

const SAVE_SESSION_NOTE = gql`
  mutation SaveSessionNote($sessionId: ID!, $content: String!) {
    saveSessionNote(sessionId: $sessionId, content: $content) {
      id
      content
      updatedAt
    }
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
    createdAt: raw.createdAt,
    npcIds: raw.npcs?.map((n: any) => n.id),
    locationIds: raw.locations?.map((l: any) => l.id),
    questIds: raw.quests?.map((q: any) => q.id),
    npcs: raw.npcs ?? [],
    locations: raw.locations ?? [],
    quests: raw.quests ?? [],
    myNote: raw.myNote ?? undefined,
  };
}

// ── Hooks ─────────────────────────────────────────────────────────

/**
 * Loads the session list for a campaign. Supports server-side filtering by
 * `search` (title substring, case-insensitive — NOT brief). Uses the
 * flicker-free pattern established by the NPC pilot.
 */
export const useSessions = (campaignId: string, opts?: { search?: string }) => {
  const { data, previousData, loading, error } = useQuery<any>(SESSIONS_QUERY, {
    variables: {
      campaignId,
      search: opts?.search?.trim() || null,
    },
    notifyOnNetworkStatusChange: true,
  });
  const effective = data ?? previousData;
  const isInitialLoad = loading && !previousData;
  return {
    data: effective?.sessions?.map(mapSession) as Session[] | undefined,
    isLoading: isInitialLoad,
    isFetching: loading,
    isError: !!error,
  };
};

export const useLastSession = (campaignId: string) => {
  // Always queries the full list (search: null) so the "last session" is
  // computed against every session, independent of any list-page filter.
  const { data, loading, error } = useQuery<any>(SESSIONS_QUERY, {
    variables: { campaignId, search: null },
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
    refetchQueries: ['Sessions'],
  });

  return {
    mutate: (session: Session, options?: { onSuccess?: () => void; only?: 'npcIds' | 'locationIds' | 'questIds' }) =>
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
            npcIds: !options?.only || options.only === 'npcIds' ? session.npcIds : undefined,
            locationIds: !options?.only || options.only === 'locationIds' ? session.locationIds : undefined,
            questIds: !options?.only || options.only === 'questIds' ? session.questIds : undefined,
          },
        },
      }).then(() => options?.onSuccess?.()).catch(() => {}),
    isPending: loading,
  };
};

export const useDeleteSession = (campaignId: string) => {
  const [deleteSession, { loading }] = useMutation(DELETE_SESSION, {
    refetchQueries: ['Sessions'],
  });

  return {
    mutate: (id: string, options?: { onSuccess?: () => void }) => {
      deleteSession({
        variables: { campaignId, id },
      }).then(() => options?.onSuccess?.()).catch(() => {});
    },
    isPending: loading,
  };
};

export const useSessionNote = (_campaignId: string) => {
  const [saveNote, { loading }] = useMutation(SAVE_SESSION_NOTE, {
    refetchQueries: ['Sessions'],
  });

  return {
    mutate: (sessionId: string, content: string) => {
      saveNote({ variables: { sessionId, content } });
    },
    isPending: loading,
  };
};
