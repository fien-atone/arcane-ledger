export interface Session {
  id: string;
  campaignId: string;
  number: number;
  title: string;
  datetime: string;
  brief?: string;
  summary: string;
  nextSessionNotes?: string;
  locationIds?: string[];
  npcIds?: string[];
  createdAt: string;
}
