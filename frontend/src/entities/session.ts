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
  createdAt: string;
}
