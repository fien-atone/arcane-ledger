import { gql } from '@apollo/client';

export const CAMPAIGN_EVENT_SUBSCRIPTION = gql`
  subscription CampaignEvent($campaignId: ID!) {
    campaignEvent(campaignId: $campaignId) {
      entityType
      entityId
      action
      campaignId
      relatedIds
    }
  }
`;
