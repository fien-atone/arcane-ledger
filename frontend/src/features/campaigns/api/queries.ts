import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';

// ── GraphQL documents ─────────────────────────────────────────────

const CAMPAIGNS_QUERY = gql`
  query Campaigns {
    campaigns {
      id
      title
      description
      createdAt
      archivedAt
      myRole
      sessionCount
      memberCount
      lastSession {
        title
        datetime
      }
    }
  }
`;

const CAMPAIGN_QUERY = gql`
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id
      title
      description
      createdAt
      archivedAt
      myRole
      sessionCount
      memberCount
      lastSession {
        title
        datetime
      }
    }
  }
`;

const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($title: String!, $description: String) {
    createCampaign(title: $title, description: $description) {
      id
      title
      description
      createdAt
      archivedAt
      myRole
      sessionCount
      memberCount
    }
  }
`;

const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $title: String, $description: String, $archivedAt: String) {
    updateCampaign(id: $id, title: $title, description: $description, archivedAt: $archivedAt) {
      id
      title
      description
      createdAt
      archivedAt
      myRole
      sessionCount
      memberCount
      lastSession {
        title
        datetime
      }
    }
  }
`;

// ── Hooks ─────────────────────────────────────────────────────────

export const useCampaigns = () => {
  const { data, loading, error } = useQuery<any>(CAMPAIGNS_QUERY);
  return {
    data: data?.campaigns as import('@/entities/campaign').CampaignSummary[] | undefined,
    isLoading: loading,
    isError: !!error,
  };
};

export const useCampaign = (id: string) => {
  const { data, loading, error } = useQuery<any>(CAMPAIGN_QUERY, {
    variables: { id },
    skip: !id,
  });
  return {
    data: data?.campaign as import('@/entities/campaign').CampaignSummary | undefined,
    isLoading: loading,
    isError: !!error,
  };
};

export const useSaveCampaign = () => {
  const [updateCampaign, { loading }] = useMutation(UPDATE_CAMPAIGN);

  return {
    mutate: (
      campaign: import('@/entities/campaign').CampaignSummary,
      options?: { onSuccess?: () => void },
    ) => {
      updateCampaign({
        variables: {
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          archivedAt: campaign.archivedAt ?? null,
        },
        refetchQueries: [
          { query: CAMPAIGN_QUERY, variables: { id: campaign.id } },
        ],
        awaitRefetchQueries: true,
      }).then(() => options?.onSuccess?.());
    },
    isPending: loading,
  };
};

export const useCreateCampaign = () => {
  const [createCampaign, { loading }] = useMutation(CREATE_CAMPAIGN, {
    refetchQueries: [{ query: CAMPAIGNS_QUERY }],
  });

  return {
    mutate: (
      campaign: import('@/entities/campaign').CampaignSummary,
      options?: { onSuccess?: (data: import('@/entities/campaign').CampaignSummary) => void },
    ) => {
      createCampaign({
        variables: {
          title: campaign.title,
          description: campaign.description,
        },
      }).then((result) => {
        const created = (result.data as any)?.createCampaign;
        options?.onSuccess?.(created);
      });
    },
    isPending: loading,
  };
};
