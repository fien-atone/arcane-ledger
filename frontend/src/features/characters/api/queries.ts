import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { PlayerCharacter } from '@/entities/character';

// ── GraphQL documents ─────────────────────────────────────────────

const PARTY_QUERY = gql`
  query Party($campaignId: ID!) {
    party(campaignId: $campaignId) {
      id
      campaignId
      userId
      name
      gender
      age
      species
      speciesId
      class
      appearance
      background
      personality
      motivation
      bonds
      flaws
      gmNotes
      image
      groupMemberships { groupId relation subfaction }
      createdAt
      updatedAt
    }
  }
`;

const ADD_CHARACTER_GROUP_MEMBERSHIP = gql`
  mutation AddCharacterGroupMembership($characterId: ID!, $groupId: ID!, $relation: String, $subfaction: String) {
    addCharacterGroupMembership(characterId: $characterId, groupId: $groupId, relation: $relation, subfaction: $subfaction) {
      id
      groupMemberships { groupId relation subfaction }
    }
  }
`;

const REMOVE_CHARACTER_GROUP_MEMBERSHIP = gql`
  mutation RemoveCharacterGroupMembership($characterId: ID!, $groupId: ID!) {
    removeCharacterGroupMembership(characterId: $characterId, groupId: $groupId) {
      id
      groupMemberships { groupId relation subfaction }
    }
  }
`;

const DELETE_CHARACTER = gql`
  mutation DeleteCharacter($campaignId: ID!, $id: ID!) {
    deleteCharacter(campaignId: $campaignId, id: $id)
  }
`;

const SAVE_CHARACTER = gql`
  mutation SaveCharacter(
    $campaignId: ID!
    $id: ID
    $userId: ID
    $name: String!
    $gender: Gender
    $age: Int
    $species: String
    $speciesId: String
    $class: String
    $appearance: String
    $background: String
    $personality: String
    $motivation: String
    $bonds: String
    $flaws: String
    $gmNotes: String
    $image: String
  ) {
    saveCharacter(
      campaignId: $campaignId
      id: $id
      userId: $userId
      name: $name
      gender: $gender
      age: $age
      species: $species
      speciesId: $speciesId
      class: $class
      appearance: $appearance
      background: $background
      personality: $personality
      motivation: $motivation
      bonds: $bonds
      flaws: $flaws
      gmNotes: $gmNotes
      image: $image
    ) {
      id
      campaignId
      userId
      name
      gender
      age
      species
      speciesId
      class
      appearance
      background
      personality
      motivation
      bonds
      flaws
      gmNotes
      image
      createdAt
      updatedAt
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────

/** Normalise the GraphQL Gender enum (UPPER) to the frontend's lowercase type. */
function mapCharacter(raw: any): PlayerCharacter {
  return {
    ...raw,
    gender: raw.gender?.toLowerCase(),
    groupMemberships: raw.groupMemberships ?? [],
  };
}

// ── Hooks ─────────────────────────────────────────────────────────

export const useParty = (campaignId: string) => {
  const { data, loading, error, refetch } = useQuery<any>(PARTY_QUERY, {
    variables: { campaignId },
  });
  return {
    data: data?.party?.map(mapCharacter) as PlayerCharacter[] | undefined,
    isLoading: loading,
    isError: !!error,
    refetch,
  };
};

export const useSaveCharacter = () => {
  const [saveCharacter, { loading }] = useMutation(SAVE_CHARACTER);

  return {
    mutate: (character: PlayerCharacter, options?: { onSuccess?: () => void }) => {
      saveCharacter({
        variables: {
          campaignId: character.campaignId,
          id: character.id || undefined,
          userId: character.userId || undefined,
          name: character.name,
          gender: character.gender?.toUpperCase(),
          age: character.age,
          species: character.species,
          speciesId: character.speciesId,
          class: character.class,
          appearance: character.appearance,
          background: character.background,
          personality: character.personality,
          motivation: character.motivation,
          bonds: character.bonds,
          flaws: character.flaws,
          gmNotes: character.gmNotes,
        },
        refetchQueries: [{ query: PARTY_QUERY, variables: { campaignId: character.campaignId } }, 'PartySlots'],
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useAddCharacterGroupMembership = () => {
  const [execute, { loading, error }] = useMutation(ADD_CHARACTER_GROUP_MEMBERSHIP);
  return {
    mutate: (
      vars: { characterId: string; groupId: string; relation?: string; subfaction?: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['Party', 'Groups'],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useRemoveCharacterGroupMembership = () => {
  const [execute, { loading, error }] = useMutation(REMOVE_CHARACTER_GROUP_MEMBERSHIP);
  return {
    mutate: (
      vars: { characterId: string; groupId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: vars,
        refetchQueries: ['Party', 'Groups'],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteCharacter = () => {
  const [execute, { loading }] = useMutation(DELETE_CHARACTER);
  return {
    mutate: (
      { campaignId, charId }: { campaignId: string; charId: string },
      opts?: { onSuccess?: () => void },
    ) => {
      execute({
        variables: { campaignId, id: charId },
        refetchQueries: ['Party', 'PartySlots'],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
  };
};
