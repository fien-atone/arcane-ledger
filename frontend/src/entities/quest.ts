export type QuestStatus = 'active' | 'completed' | 'failed' | 'unavailable' | 'unknown';

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
  completedAt?: string;
}
