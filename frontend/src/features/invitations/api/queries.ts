import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { CampaignInvitation } from '@/entities/invitation';
import type { PartySlot } from '@/entities/partySlot';

// ── GraphQL documents ─────────────────────────────────────────────

const MY_INVITATIONS_QUERY = gql`
  query MyInvitations {
    myInvitations {
      id
      campaignId
      campaign { id title }
      user { id name email }
      invitedBy { id name }
      status
      createdAt
    }
  }
`;

const CAMPAIGN_INVITATIONS_QUERY = gql`
  query CampaignInvitations($campaignId: ID!) {
    campaignInvitations(campaignId: $campaignId) {
      id
      user { id name email }
      invitedBy { id name }
      status
      createdAt
    }
  }
`;

const PARTY_SLOTS_QUERY = gql`
  query PartySlots($campaignId: ID!) {
    partySlots(campaignId: $campaignId) {
      member { id user { id name email } role }
      character {
        id campaignId userId name gender age species speciesId class
        appearance background personality motivation bonds flaws
        gmNotes image
        groupMemberships { groupId relation subfaction }
        createdAt updatedAt
      }
      invitation { id user { id name email } status }
    }
  }
`;

const SEARCH_USERS_QUERY = gql`
  query SearchUsers($campaignId: ID!, $query: String!) {
    searchUsers(campaignId: $campaignId, query: $query) {
      id
      name
      email
    }
  }
`;

const INVITE_PLAYER = gql`
  mutation InvitePlayer($campaignId: ID!, $userId: ID!) {
    invitePlayer(campaignId: $campaignId, userId: $userId) {
      id
      user { id name email }
      invitedBy { id name }
      status
      createdAt
    }
  }
`;

const CANCEL_INVITATION = gql`
  mutation CancelInvitation($id: ID!) {
    cancelInvitation(id: $id)
  }
`;

const RESPOND_TO_INVITATION = gql`
  mutation RespondToInvitation($id: ID!, $accept: Boolean!) {
    respondToInvitation(id: $id, accept: $accept) {
      id
      status
    }
  }
`;

const ASSIGN_CHARACTER_TO_PLAYER = gql`
  mutation AssignCharacterToPlayer($characterId: ID!, $userId: ID) {
    assignCharacterToPlayer(characterId: $characterId, userId: $userId) {
      id
      userId
    }
  }
`;

const REMOVE_CAMPAIGN_MEMBER = gql`
  mutation RemoveCampaignMember($campaignId: ID!, $userId: ID!) {
    removeCampaignMember(campaignId: $campaignId, userId: $userId)
  }
`;

// ── Helpers ───────────────────────────────────────────────────────

function mapInvitation(raw: any): CampaignInvitation {
  return {
    ...raw,
    status: raw.status?.toLowerCase(),
  };
}

function mapPartySlot(raw: any): PartySlot {
  return {
    member: raw.member ?? undefined,
    character: raw.character
      ? {
          ...raw.character,
          gender: raw.character.gender?.toLowerCase(),
          groupMemberships: raw.character.groupMemberships ?? [],
        }
      : undefined,
    invitation: raw.invitation
      ? mapInvitation(raw.invitation)
      : undefined,
  };
}

// ── Query hooks ──────────────────────────────────────────────────

export const useMyInvitations = () => {
  const { data, loading, error, refetch } = useQuery<any>(MY_INVITATIONS_QUERY);
  return {
    data: (data?.myInvitations ?? []).map(mapInvitation) as CampaignInvitation[],
    isLoading: loading,
    isError: !!error,
    refetch,
  };
};

export const useCampaignInvitations = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(CAMPAIGN_INVITATIONS_QUERY, {
    variables: { campaignId },
    skip: !campaignId,
  });
  return {
    data: (data?.campaignInvitations ?? []).map(mapInvitation) as CampaignInvitation[],
    isLoading: loading,
    isError: !!error,
  };
};

export const usePartySlots = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(PARTY_SLOTS_QUERY, {
    variables: { campaignId },
    skip: !campaignId,
  });
  return {
    data: (data?.partySlots ?? []).map(mapPartySlot) as PartySlot[],
    isLoading: loading,
    isError: !!error,
  };
};

export const useSearchUsers = (campaignId: string, query: string) => {
  const { data, loading, error } = useQuery<any>(SEARCH_USERS_QUERY, {
    variables: { campaignId, query },
    skip: !campaignId || query.length < 2,
    fetchPolicy: 'network-only',
  });
  return {
    data: (data?.searchUsers ?? []) as { id: string; name: string; email: string }[],
    isLoading: loading,
    isError: !!error,
  };
};

// ── Mutation hooks ───────────────────────────────────────────────

export const useInvitePlayer = () => {
  const [execute, { loading }] = useMutation(INVITE_PLAYER);
  return {
    mutate: (
      vars: { campaignId: string; userId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['CampaignInvitations', 'PartySlots', 'SearchUsers'],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useCancelInvitation = () => {
  const [execute, { loading }] = useMutation(CANCEL_INVITATION);
  return {
    mutate: (
      id: string,
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: { id },
        refetchQueries: ['CampaignInvitations', 'PartySlots', 'SearchUsers'],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useRespondToInvitation = () => {
  const [execute, { loading }] = useMutation(RESPOND_TO_INVITATION);
  return {
    mutate: (
      vars: { id: string; accept: boolean },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['MyInvitations', 'Campaigns'],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useAssignCharacterToPlayer = () => {
  const [execute, { loading }] = useMutation(ASSIGN_CHARACTER_TO_PLAYER);
  return {
    mutate: (
      vars: { characterId: string; userId?: string | null },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['PartySlots', 'Party'],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useRemoveCampaignMember = () => {
  const [execute, { loading }] = useMutation(REMOVE_CAMPAIGN_MEMBER);
  return {
    mutate: (
      vars: { campaignId: string; userId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['PartySlots', 'Party', 'SearchUsers'],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
  };
};
