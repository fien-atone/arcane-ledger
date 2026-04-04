export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface CampaignInvitation {
  id: string;
  campaignId: string;
  campaign?: { id: string; title: string };
  user: { id: string; name: string; email: string; avatar?: string };
  invitedBy: { id: string; name: string };
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}
