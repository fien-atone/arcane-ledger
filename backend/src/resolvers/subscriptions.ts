import { pubsub, campaignTopic } from '../pubsub.js';

export const subscriptionResolvers = {
  Subscription: {
    campaignEvent: {
      subscribe: (_: unknown, { campaignId }: { campaignId: string }) =>
        pubsub.asyncIterableIterator(campaignTopic(campaignId)),
    },
  },
};
