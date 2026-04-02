export interface Session {
  id: string;
  campaignId: string;
  number: number;
  title: string;
  datetime: string;
  brief?: string;
  summary: string;
  locationIds?: string[];
  npcIds?: string[];
  questIds?: string[];
  playerVisible?: boolean;
  playerVisibleFields?: string[];
  myNote?: { id: string; content: string; updatedAt: string };
  createdAt: string;
}
