import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
} from '@/entities/locationType';

// ── Queries ──────────────────────────────────────────────────────────────────

const LOCATION_TYPES_QUERY = gql`
  query LocationTypes($campaignId: ID!) {
    locationTypes(campaignId: $campaignId) {
      id name icon category biomeOptions isSettlement builtin
    }
  }
`;

const CONTAINMENT_RULES_QUERY = gql`
  query ContainmentRules {
    containmentRules {
      id parentTypeId childTypeId
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_LOCATION_TYPE = gql`
  mutation SaveLocationType(
    $campaignId: ID!, $id: ID, $name: String!, $icon: String!, $category: String!,
    $biomeOptions: [String!], $isSettlement: Boolean
  ) {
    saveLocationType(
      campaignId: $campaignId, id: $id, name: $name, icon: $icon, category: $category,
      biomeOptions: $biomeOptions, isSettlement: $isSettlement
    ) {
      id name icon category biomeOptions isSettlement builtin
    }
  }
`;

const DELETE_LOCATION_TYPE = gql`
  mutation DeleteLocationType($id: ID!) {
    deleteLocationType(id: $id)
  }
`;

const SAVE_CONTAINMENT_RULE = gql`
  mutation SaveContainmentRule($id: ID, $parentTypeId: String!, $childTypeId: String!) {
    saveContainmentRule(id: $id, parentTypeId: $parentTypeId, childTypeId: $childTypeId) {
      id parentTypeId childTypeId
    }
  }
`;

const DELETE_CONTAINMENT_RULE = gql`
  mutation DeleteContainmentRule($id: ID!) {
    deleteContainmentRule(id: $id)
  }
`;

// ── Type Hooks ───────────────────────────────────────────────────────────────

export function useLocationTypes(campaignId?: string) {
  const { data, loading, error } = useQuery<any>(LOCATION_TYPES_QUERY, {
    variables: { campaignId },
    skip: !campaignId,
  });
  return { data: data?.locationTypes as LocationTypeEntry[] | undefined, isLoading: loading, isError: !!error, error };
}

export function useSaveLocationType(campaignId: string) {
  const [execute, { loading, error }] = useMutation(SAVE_LOCATION_TYPE);
  return {
    mutate: (entry: LocationTypeEntry, opts?: { onSuccess?: () => void }) => {
      const { id, createdAt, builtin, ...rest } = entry;
      execute({
        variables: { campaignId, id: id || undefined, ...rest },
        refetchQueries: ['LocationTypes'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
}

export function useDeleteLocationType() {
  const [execute, { loading, error }] = useMutation(DELETE_LOCATION_TYPE);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: ['LocationTypes', 'ContainmentRules'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
}

// ── Containment Rule Hooks ───────────────────────────────────────────────────

export function useContainmentRules() {
  const { data, loading, error } = useQuery<any>(CONTAINMENT_RULES_QUERY);
  return { data: data?.containmentRules as LocationTypeContainmentRule[] | undefined, isLoading: loading, isError: !!error, error };
}

export function useSaveContainmentRule() {
  const [execute, { loading, error }] = useMutation(SAVE_CONTAINMENT_RULE);
  return {
    mutate: (rule: LocationTypeContainmentRule, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id: rule.id || undefined, parentTypeId: rule.parentTypeId, childTypeId: rule.childTypeId },
        refetchQueries: ['ContainmentRules'],
        awaitRefetchQueries: true,
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
}

export function useDeleteContainmentRule() {
  const [execute, { loading, error }] = useMutation(DELETE_CONTAINMENT_RULE);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: [{ query: CONTAINMENT_RULES_QUERY }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
}
