export interface Group {
  id: string;
  campaignId: string;
  name: string;
  type: string;
  aliases: string[];
  description: string;
  goals?: string;
  symbols?: string;
  gmNotes?: string;
  partyRelation?: string;
  createdAt: string;
  updatedAt: string;
}
