export type QuestStatus = 'active' | 'completed' | 'failed' | 'unavailable' | 'undiscovered';

export interface Quest {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  giverId?: string;
  reward?: string;
  status: QuestStatus;
  notes: string;
  playerVisible?: boolean;
  playerVisibleFields?: string[];
  createdAt: string;
  giver?: { id: string; name: string; species?: string; image?: string };
  sessions?: { id: string; number: number; title: string; datetime?: string }[];
}
