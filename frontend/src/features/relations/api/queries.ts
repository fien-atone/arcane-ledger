import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Relation } from '@/entities/relation';

// ── Queries ──────────────────────────────────────────────────────────────────

const RELATIONS_FOR_ENTITY_QUERY = gql`
  query RelationsForEntity($campaignId: ID!, $entityId: ID!) {
    relationsForEntity(campaignId: $campaignId, entityId: $entityId) {
      id campaignId
      fromEntity { type id }
      toEntity { type id }
      friendliness note createdAt updatedAt
    }
  }
`;

const RELATIONS_FOR_CAMPAIGN_QUERY = gql`
  query RelationsForCampaign($campaignId: ID!) {
    relationsForCampaign(campaignId: $campaignId) {
      id campaignId
      fromEntity { type id }
      toEntity { type id }
      friendliness note createdAt updatedAt
    }
  }
`;

// ── Mutations ────────────────────────────────────────────────────────────────

const SAVE_RELATION = gql`
  mutation SaveRelation($campaignId: ID!, $id: ID, $input: RelationInput!) {
    saveRelation(campaignId: $campaignId, id: $id, input: $input) {
      id campaignId
      fromEntity { type id }
      toEntity { type id }
      friendliness note createdAt updatedAt
    }
  }
`;

const DELETE_RELATION = gql`
  mutation DeleteRelation($id: ID!) {
    deleteRelation(id: $id)
  }
`;

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useRelationsForEntity = (campaignId: string, entityId: string) => {
  const { data, loading, error } = useQuery<any>(RELATIONS_FOR_ENTITY_QUERY, {
    variables: { campaignId, entityId },
    skip: !campaignId || !entityId,
  });
  return { data: data?.relationsForEntity as Relation[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useRelationsForCampaign = (campaignId: string) => {
  const { data, loading, error } = useQuery<any>(RELATIONS_FOR_CAMPAIGN_QUERY, {
    variables: { campaignId },
    skip: !campaignId,
  });
  return { data: data?.relationsForCampaign as Relation[] | undefined, isLoading: loading, isError: !!error, error };
};

export const useSaveRelation = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(SAVE_RELATION);
  return {
    mutate: (relation: Relation, opts?: { onSuccess?: () => void }) => {
      const { id, campaignId: cId, createdAt, updatedAt, fromEntity, toEntity, ...rest } = relation;
      const input = {
        fromEntityType: fromEntity.type,
        fromEntityId: fromEntity.id,
        toEntityType: toEntity.type,
        toEntityId: toEntity.id,
        ...rest,
      };
      execute({
        variables: { campaignId, id, input },
        refetchQueries: [{ query: RELATIONS_FOR_CAMPAIGN_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};

export const useDeleteRelation = (campaignId: string) => {
  const [execute, { loading, error }] = useMutation(DELETE_RELATION);
  return {
    mutate: (id: string, opts?: { onSuccess?: () => void }) => {
      execute({
        variables: { id },
        refetchQueries: [{ query: RELATIONS_FOR_CAMPAIGN_QUERY, variables: { campaignId } }],
      }).then(() => opts?.onSuccess?.());
    },
    isLoading: loading,
    isPending: loading,
    isError: !!error,
  };
};
