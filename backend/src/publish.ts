import { pubsub, campaignTopic } from './pubsub.js';

type Action = 'CREATED' | 'UPDATED' | 'DELETED';

/**
 * Fire-and-forget publish of a campaign event to all subscribers.
 * Wrapped in try/catch so a publish failure never breaks a mutation.
 */
export function publishCampaignEvent(
  campaignId: string,
  entityType: string,
  entityId: string,
  action: Action,
  relatedIds?: string[],
) {
  const event = { entityType, entityId, action, campaignId, relatedIds: relatedIds ?? [] };
  try {
    pubsub.publish(campaignTopic(campaignId), { campaignEvent: event });
    // Also publish to global campaigns topic for campaign-level changes
    if (entityType === 'CAMPAIGN') {
      pubsub.publish('CAMPAIGNS_CHANGED', { campaignsChanged: event });
    }
  } catch {
    // Silently ignore publish errors — never fail a mutation because of PubSub
  }
}
