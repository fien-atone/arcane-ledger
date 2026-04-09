import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { NPC } from '@/entities/npc';

// ── Queries ──────────────────────────────────────────────────────────────────

const NPCS_QUERY = gql`
  query Npcs($campaignId: ID!, $search: String, $status: String) {
    npcs(campaignId: $campaignId, search: $search, status: $status) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const NPC_QUERY = gql`
  query Npc($campaignId: ID!, $id: ID!) {
    npc(campaignId: $campaignId, id: $id) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      playerVisible playerVisibleFields
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_NPC = gql`
  mutation SaveNPC($campaignId: ID!, $id: ID, $input: NPCInput!) {
    saveNPC(campaignId: $campaignId, id: $id, input: $input) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      createdAt updatedAt
      locationPresences { locationId note playerVisible }
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const ADD_NPC_GROUP_MEMBERSHIP = gql`
  mutation AddNPCGroupMembership($npcId: ID!, $groupId: ID!, $relation: String, $subfaction: String) {
    addNPCGroupMembership(npcId: $npcId, groupId: $groupId, relation: $relation, subfaction: $subfaction) {
      id
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const REMOVE_NPC_GROUP_MEMBERSHIP = gql`
  mutation RemoveNPCGroupMembership($npcId: ID!, $groupId: ID!) {
    removeNPCGroupMembership(npcId: $npcId, groupId: $groupId) {
      id
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const ADD_NPC_LOCATION_PRESENCE = gql`
  mutation AddNPCLocationPresence($npcId: ID!, $locationId: ID!, $note: String) {
    addNPCLocationPresence(npcId: $npcId, locationId: $locationId, note: $note) {
      id
      locationPresences { locationId note playerVisible }
    }
  }
`;

const REMOVE_NPC_LOCATION_PRESENCE = gql`
  mutation RemoveNPCLocationPresence($npcId: ID!, $locationId: ID!) {
    removeNPCLocationPresence(npcId: $npcId, locationId: $locationId) {
      id
      locationPresences { locationId note playerVisible }
    }
  }
`;

const SET_NPC_GROUP_MEMBERSHIP_VISIBILITY = gql`
  mutation SetNPCGroupMembershipVisibility($npcId: ID!, $groupId: ID!, $playerVisible: Boolean!) {
    setNPCGroupMembershipVisibility(npcId: $npcId, groupId: $groupId, playerVisible: $playerVisible) {
      id
      groupMemberships { groupId relation subfaction playerVisible }
    }
  }
`;

const SET_NPC_LOCATION_PRESENCE_VISIBILITY = gql`
  mutation SetNPCLocationPresenceVisibility($npcId: ID!, $locationId: ID!, $playerVisible: Boolean!) {
    setNPCLocationPresenceVisibility(npcId: $npcId, locationId: $locationId, playerVisible: $playerVisible) {
      id
      locationPresences { locationId note playerVisible }
    }
  }
`;

const SET_NPC_VISIBILITY = gql`
  mutation SetNPCVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
    setNPCVisibility(campaignId: $campaignId, id: $id, input: $input) {
      id playerVisible playerVisibleFields
    }
  }
`;

const DELETE_NPC = gql`
  mutation DeleteNPC($campaignId: ID!, $id: ID!) {
    deleteNPC(campaignId: $campaignId, id: $id)
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise GraphQL enum fields (UPPER_CASE) to the frontend's lowercase types. */
function mapNpc(raw: any): NPC {
  return {
    ...raw,
    status: raw.status?.toLowerCase(),
    gender: raw.gender?.toLowerCase(),
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Loads the NPC list for a campaign. Supports server-side filtering by
 * `search` (name substring, case-insensitive — NOT aliases) and `status`
 * (case-insensitive, normalized to UPPERCASE by the resolver).
 *
 * Flicker-free strategy (F-11 pilot):
 *  - `notifyOnNetworkStatusChange: true` makes Apollo emit a non-terminal
 *    loading state when variables change (not just the initial fetch).
 *  - We return `data ?? previousData` so the caller keeps rendering the
 *    previous result set while the new query is in flight. Apollo v4 exposes
 *    `previousData` natively on the query result. Combined with the
 *    `GlobalLoadingBar` (already wired to the Apollo request counter), the
 *    user sees the existing list plus a top progress indicator, never a
 *    blank state.
 *  - `isLoading` still reports `true` on the very first load (no previous
 *    data to fall back on) so pages can show their initial skeleton.
 */
export const useNpcs = (
  campaignId: string,
  opts?: { search?: string; status?: string },
) => {
  const { data, previousData, loading, error } = useQuery<any>(NPCS_QUERY, {
    variables: {
      campaignId,
      search: opts?.search?.trim() || null,
      status: opts?.status || null,
    },
    // Apollo client's default fetchPolicy is 'no-cache' (see apolloClient.ts),
    // but `previousData` is tracked on the observable regardless of cache
    // policy — so the flicker-free behavior works even without the cache.
    notifyOnNetworkStatusChange: true,
  });
  const effective = data ?? previousData;
  // Only treat it as "loading" on the very first load — when we already
  // have previousData to show, keep isLoading false so the list stays
  // visible and the GlobalLoadingBar is the only moving UI.
  const isInitialLoad = loading && !previousData;
  return {
    data: effective?.npcs?.map(mapNpc) as NPC[] | undefined,
    isLoading: isInitialLoad,
    isFetching: loading,
    isError: !!error,
    error,
  };
};

export const useNpc = (campaignId: string, npcId: string) => {
  const { data, loading, error, refetch } = useQuery<any>(NPC_QUERY, {
    variables: { campaignId, id: npcId },
    skip: !npcId,
  });
  return { data: data?.npc ? mapNpc(data.npc) as NPC : undefined, isLoading: loading, isError: !!error, error, refetch };
};

export const useSaveNpc = () => {
  const [execute, { loading, error }] = useMutation(SAVE_NPC);
  return {
    mutate: (npc: NPC, opts?: { onSuccess?: () => void }) => {
      const input = {
        name: npc.name,
        aliases: npc.aliases,
        status: npc.status?.toUpperCase(),
        gender: npc.gender?.toUpperCase() || undefined,
        age: npc.age,
        species: npc.species,
        speciesId: npc.speciesId,
        appearance: npc.appearance,
        personality: npc.personality,
        description: npc.description,
        motivation: npc.motivation,
        flaws: npc.flaws,
        gmNotes: npc.gmNotes,
      };
      execute({
        variables: { campaignId: npc.campaignId, id: npc.id || undefined, input },
        refetchQueries: ['Npcs'],
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useAddNPCGroupMembership = () => {
  const [execute, { loading, error }] = useMutation(ADD_NPC_GROUP_MEMBERSHIP);
  return {
    mutate: (
      vars: { npcId: string; groupId: string; relation?: string; subfaction?: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['Npcs', 'Groups'],
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useRemoveNPCGroupMembership = () => {
  const [execute, { loading, error }] = useMutation(REMOVE_NPC_GROUP_MEMBERSHIP);
  return {
    mutate: (
      vars: { npcId: string; groupId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['Npcs', 'Groups'],
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useAddNPCLocationPresence = () => {
  const [execute, { loading, error }] = useMutation(ADD_NPC_LOCATION_PRESENCE);
  return {
    mutate: (
      vars: { npcId: string; locationId: string; note?: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['Npcs'],
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isPending: loading,
    isError: !!error,
  };
};

export const useRemoveNPCLocationPresence = () => {
  const [execute, { loading, error }] = useMutation(REMOVE_NPC_LOCATION_PRESENCE);
  return {
    mutate: (
      vars: { npcId: string; locationId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['Npcs'],
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isPending: loading,
    isError: !!error,
  };
};

export const useSetNpcVisibility = () => {
  const [execute, { loading }] = useMutation(SET_NPC_VISIBILITY);
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

      });
    },
    isPending: loading,
  };
};

export const useSetNPCGroupMembershipVisibility = () => {
  const [execute, { loading }] = useMutation(SET_NPC_GROUP_MEMBERSHIP_VISIBILITY);
  return {
    mutate: (vars: { npcId: string; groupId: string; playerVisible: boolean }) => {
      execute({ variables: vars });
    },
    isPending: loading,
  };
};

export const useSetNPCLocationPresenceVisibility = () => {
  const [execute, { loading }] = useMutation(SET_NPC_LOCATION_PRESENCE_VISIBILITY);
  return {
    mutate: (vars: { npcId: string; locationId: string; playerVisible: boolean }) => {
      execute({ variables: vars });
    },
    isPending: loading,
  };
};

export const useDeleteNpc = () => {
  const [execute, { loading, error }] = useMutation(DELETE_NPC);
  return {
    mutate: (
      { campaignId, npcId }: { campaignId: string; npcId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: { campaignId, id: npcId },
        refetchQueries: ['Npcs'],
      }).then(() => opts?.onSuccess?.()).catch(() => {});
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
