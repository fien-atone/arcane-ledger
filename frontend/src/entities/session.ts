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
  createdAt: string;
}
