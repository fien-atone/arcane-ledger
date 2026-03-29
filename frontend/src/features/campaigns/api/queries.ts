import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { ALL_SECTIONS } from '@/entities/campaign';
import type { CampaignSection, CampaignSummary } from '@/entities/campaign';

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
      enabledSections
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
      enabledSections
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

const UPDATE_CAMPAIGN_SECTIONS = gql`
  mutation UpdateCampaignSections($campaignId: ID!, $sections: [String!]!) {
    updateCampaignSections(campaignId: $campaignId, sections: $sections) {
      id
      enabledSections
    }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────

/** Returns effective enabled sections. Empty array = all enabled (backward compat). */
export function getEnabledSections(campaign: CampaignSummary | undefined): CampaignSection[] {
  if (!campaign || !campaign.enabledSections || campaign.enabledSections.length === 0) return ALL_SECTIONS;
  return campaign.enabledSections.map((s) => s.toLowerCase() as CampaignSection);
}

/** Hook: check if a specific section is enabled for a campaign. */
export function useSectionEnabled(campaignId: string, section: CampaignSection): boolean {
  const { data: campaign } = useCampaign(campaignId);
  const enabled = getEnabledSections(campaign);
  return new Set(enabled).has(section);
}

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

export const useUpdateCampaignSections = () => {
  const [mutate, { loading }] = useMutation(UPDATE_CAMPAIGN_SECTIONS);
  return {
    mutate: (campaignId: string, sections: CampaignSection[]) =>
      mutate({
        variables: { campaignId, sections: sections.map((s) => s.toUpperCase()) },
        refetchQueries: [{ query: CAMPAIGN_QUERY, variables: { id: campaignId } }],
      }),
    isPending: loading,
  };
};
