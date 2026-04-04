/** All possible sidebar section identifiers */
export type CampaignSection =
  | 'sessions' | 'npcs' | 'locations' | 'location_types' | 'groups' | 'group_types'
  | 'quests' | 'party' | 'social_graph' | 'species' | 'species_types';

export const ALL_SECTIONS: CampaignSection[] = [
  'sessions', 'npcs', 'locations', 'location_types', 'groups', 'group_types',
  'quests', 'party', 'social_graph', 'species', 'species_types',
];

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
  /** Enabled sidebar sections — empty array means all enabled */
  enabledSections: CampaignSection[];
}
