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

export const USER_EVENT_SUBSCRIPTION = gql`
  subscription UserEvent($userId: ID!) {
    userEvent(userId: $userId) {
      type
      entityId
    }
  }
`;
