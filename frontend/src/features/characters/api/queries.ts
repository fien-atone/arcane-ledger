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
      createdAt
      updatedAt
    }
  }
`;

const SAVE_CHARACTER = gql`
  mutation SaveCharacter(
    $campaignId: ID!
    $id: ID
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
  };
}

// ── Hooks ─────────────────────────────────────────────────────────

export const useParty = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(PARTY_QUERY, {
    variables: { campaignId },
  });
  return {
    data: data?.party?.map(mapCharacter) as PlayerCharacter[] | undefined,
    isLoading: loading,
    isError: !!error,
  };
};

export const useSaveCharacter = () => {
  const [saveCharacter, { loading }] = useMutation(SAVE_CHARACTER);

  return {
    mutate: (character: PlayerCharacter, options?: { onSuccess?: () => void }) => {
      saveCharacter({
        variables: {
          campaignId: character.campaignId,
          id: character.id,
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
          image: character.image,
        },
        refetchQueries: [{ query: PARTY_QUERY, variables: { campaignId: character.campaignId } }],
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};
