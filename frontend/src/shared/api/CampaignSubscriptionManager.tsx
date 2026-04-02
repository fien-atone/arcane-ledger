import { useSubscription, useApolloClient } from '@apollo/client/react';
import { CAMPAIGN_EVENT_SUBSCRIPTION } from './subscriptions';
import { REFETCH_MAP } from './subscriptionRefetchMap';

interface CampaignEvent {
  entityType: string;
  entityId: string;
  action: string;
  campaignId: string;
  relatedIds: string[] | null;
}

interface CampaignEventData {
  campaignEvent: CampaignEvent;
}

interface Props {
  campaignId: string;
}

export function CampaignSubscriptionManager({ campaignId }: Props) {
  const client = useApolloClient();

  useSubscription<CampaignEventData>(CAMPAIGN_EVENT_SUBSCRIPTION, {
    variables: { campaignId },
    onData: ({ data }) => {
      const event = data.data?.campaignEvent;
      if (!event) return;

      const queryNames = REFETCH_MAP[event.entityType] ?? [];
      if (!queryNames.length) return;

      client.refetchQueries({
        include: 'active',
        onQueryUpdated(observableQuery) {
          if (observableQuery.queryName && queryNames.includes(observableQuery.queryName)) {
            return observableQuery.refetch();
          }
          return false;
        },
      }).catch(() => {});
    },
  });

  return null;
}
