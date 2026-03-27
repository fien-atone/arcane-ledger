import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { NPC } from '@/entities/npc';

// ── Queries ──────────────────────────────────────────────────────────────────

const NPCS_QUERY = gql`
  query Npcs($campaignId: ID!) {
    npcs(campaignId: $campaignId) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      createdAt updatedAt
      locationPresences { locationId note }
      groupMemberships { groupId relation subfaction }
    }
  }
`;

const NPC_QUERY = gql`
  query Npc($campaignId: ID!, $id: ID!) {
    npc(campaignId: $campaignId, id: $id) {
      id campaignId name aliases status gender age species speciesId
      appearance personality description motivation flaws gmNotes image
      createdAt updatedAt
      locationPresences { locationId note }
      groupMemberships { groupId relation subfaction }
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
      locationPresences { locationId note }
      groupMemberships { groupId relation subfaction }
    }
  }
`;

const DELETE_NPC = gql`
  mutation DeleteNPC($campaignId: ID!, $id: ID!) {
    deleteNPC(campaignId: $campaignId, id: $id)
  }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useNpcs = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(NPCS_QUERY, {
    variables: { campaignId },
  });
  return { data: data?.npcs as NPC[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useNpc = (campaignId: string, npcId: string) => {
  const { data, loading, error } = useQuery<any>(NPC_QUERY, {
    variables: { campaignId, id: npcId },
    skip: !npcId,
  });
  return { data: data?.npc as NPC | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveNpc = () => {
  const [execute, { loading, error }] = useMutation(SAVE_NPC);
  return {
    mutate: (npc: NPC, opts?: { onSuccess?: () => void }) => {
      const { id, campaignId, createdAt, updatedAt, ...rest } = npc;
      execute({
        variables: { campaignId, id, input: rest },
        refetchQueries: [{ query: NPCS_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
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
        refetchQueries: [{ query: NPCS_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
