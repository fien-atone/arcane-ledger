import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Location } from '@/entities/location';

// ── Queries ──────────────────────────────────────────────────────────────────

const LOCATIONS_QUERY = gql`
  query Locations($campaignId: ID!) {
    locations(campaignId: $campaignId) {
      id campaignId name aliases type settlementPopulation biome
      parentLocationId description image gmNotes createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
    }
  }
`;

const LOCATION_QUERY = gql`
  query Location($campaignId: ID!, $id: ID!) {
    location(campaignId: $campaignId, id: $id) {
      id campaignId name aliases type settlementPopulation biome
      parentLocationId description image gmNotes createdAt
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
      id campaignId name aliases type settlementPopulation biome
      parentLocationId description image gmNotes createdAt
      mapMarkers { id x y label linkedLocationId linkedNpcId }
    }
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
  const { data, loading, error } = useQuery<any>(LOCATION_QUERY, {
    variables: { campaignId, id: locationId },
    skip: !locationId,
  });
  return { data: data?.location as Location | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveLocation = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(SAVE_LOCATION);
  return {
    mutate: (loc: Location, opts?: { onSuccess?: () => void }) => {
      const { id, campaignId: cId, createdAt, ...rest } = loc;
      const input = {
        ...rest,
        mapMarkers: rest.mapMarkers ? JSON.stringify(rest.mapMarkers) : undefined,
      };
      execute({
        variables: { campaignId, id, input },
        refetchQueries: [
          { query: LOCATIONS_QUERY, variables: { campaignId } },
          { query: LOCATION_QUERY, variables: { campaignId, id } },
        ],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
