export interface Campaign {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  archivedAt?: string;
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  role: 'gm' | 'player';
  joinedAt: string;
}

/** View-model returned by the list endpoint — Campaign + computed stats */
export interface CampaignSummary extends Campaign {
  sessionCount: number;
  memberCount: number;
  lastSession?: { title: string; datetime: string };
  /** Current user's role in this campaign */
  myRole: 'gm' | 'player';
  /** Populated when myRole === 'player' */
  myCharacterName?: string;
}
