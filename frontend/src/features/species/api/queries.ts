import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Species } from '@/entities/species';

// ── Queries ──────────────────────────────────────────────────────────────────

const SPECIES_QUERY = gql`
  query Species {
    species {
      id name pluralName type size description traits image
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_SPECIES = gql`
  mutation SaveSpecies(
    $id: ID, $name: String!, $pluralName: String, $type: String!,
    $size: String!, $description: String, $traits: [String!], $image: String
  ) {
    saveSpecies(
      id: $id, name: $name, pluralName: $pluralName, type: $type,
      size: $size, description: $description, traits: $traits, image: $image
    ) {
      id name pluralName type size description traits image
    }
  }
`;

const DELETE_SPECIES = gql`
  mutation DeleteSpecies($id: ID!) {
    deleteSpecies(id: $id)
  }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useSpecies = () => {
  const { data, loading, error } = useQuery<any>(SPECIES_QUERY);
  return { data: data?.species as Species[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useSpeciesById = (id?: string) => {
  const { data, loading, error } = useQuery<any>(SPECIES_QUERY, { skip: !id });
  const species = id ? (data?.species as Species[] | undefined)?.find((s: Species) => s.id === id) : undefined;
  return { data: species, isLoading: loading, isError: !!error, error };
};

export const useSaveSpecies = () => {
  const [execute, { loading, error }] = useMutation(SAVE_SPECIES);
  return {
    mutate: (species: Species, opts?: { onSuccess?: () => void }) => {
      const { id, createdAt, ...rest } = species;
      execute({
        variables: { id, ...rest },
        refetchQueries: [{ query: SPECIES_QUERY }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteSpecies = () => {
  const [execute, { loading, error }] = useMutation(DELETE_SPECIES);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: [{ query: SPECIES_QUERY }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
