import { PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

/** Single topic per campaign */
export const campaignTopic = (campaignId: string) =>
  `CAMPAIGN_EVENT:${campaignId}`;
