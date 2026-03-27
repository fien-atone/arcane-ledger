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
  createdAt: string;
}
