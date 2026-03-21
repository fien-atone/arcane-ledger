export interface Faction {
  id: string;
  campaignId: string;
  name: string;
  aliases: string[];
  description: string;
  goals?: string;
  symbols?: string;
  partyRelation?: string;
  createdAt: string;
}
