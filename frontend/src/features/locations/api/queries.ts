import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Location } from '@/entities/location';

// ── Queries ──────────────────────────────────────────────────────────────────

const LOCATIONS_QUERY = gql`
  query Locations($campaignId: ID!) {
    locations(campaignId: $campaignId) {
      id campaignId name type settlementPopulation biome
      parentLocationId description image gmNotes
      playerVisible playerVisibleFields
      createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
    }
  }
`;

const LOCATION_QUERY = gql`
  query Location($campaignId: ID!, $id: ID!) {
    location(campaignId: $campaignId, id: $id) {
      id campaignId name type settlementPopulation biome
      parentLocationId description image gmNotes
      playerVisible playerVisibleFields
      createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
      children { id name type }
      npcsHere { id name status }
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_LOCATION = gql`
  mutation SaveLocation($campaignId: ID!, $id: ID, $input: LocationInput!) {
    saveLocation(campaignId: $campaignId, id: $id, input: $input) {
      id campaignId name type settlementPopulation biome
      parentLocationId description image gmNotes createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
    }
  }
`;

const SET_LOCATION_VISIBILITY = gql`
  mutation SetLocationVisibility($campaignId: ID!, $id: ID!, $input: SetEntityVisibilityInput!) {
    setLocationVisibility(campaignId: $campaignId, id: $id, input: $input) {
      id playerVisible playerVisibleFields
    }
  }
`;

const DELETE_LOCATION = gql`
  mutation DeleteLocation($campaignId: ID!, $id: ID!) {
    deleteLocation(campaignId: $campaignId, id: $id)
  }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useLocations = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(LOCATIONS_QUERY, {
    variables: { campaignId },
  });
  return { data: data?.locations as Location[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useLocation = (campaignId: string, locationId: string) => {
  const { data, loading, error, refetch } = useQuery<any>(LOCATION_QUERY, {
    variables: { campaignId, id: locationId },
    skip: !locationId,
  });
  return { data: data?.location as Location | undefined, isLoading: loading, isError: !!error, error, refetch };
};

export const useSaveLocation = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(SAVE_LOCATION);
  return {
    mutate: (loc: Location, opts?: { onSuccess?: (saved: Location) => void }) => {
      const { id } = loc;
      const input = {
        name: loc.name,
        type: loc.type,
        parentLocationId: loc.parentLocationId,
        settlementPopulation: loc.settlementPopulation,
        biome: loc.biome,
        description: loc.description,
        gmNotes: loc.gmNotes,
        mapMarkers: loc.mapMarkers ? JSON.stringify(loc.mapMarkers) : undefined,
      };
      execute({
        variables: { campaignId, id: id || undefined, input },
        refetchQueries: [
          { query: LOCATIONS_QUERY, variables: { campaignId } },
          { query: LOCATION_QUERY, variables: { campaignId, id } },
        ],
      }).then((result) => {
        const saved = (result.data as any)?.saveLocation;
        opts?.onSuccess?.(saved ? { ...loc, ...saved } : loc);
      });
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useSetLocationVisibility = () => {
  const [execute, { loading }] = useMutation(SET_LOCATION_VISIBILITY);
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

export const useDeleteLocation = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(DELETE_LOCATION);
  return {
    mutate: (locationId: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { campaignId, id: locationId },
        refetchQueries: [{ query: LOCATIONS_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isPending: loading,
    isError: !!error,
  };
};
