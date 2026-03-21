export type GroupType = 'faction' | 'guild' | 'family' | 'religion' | 'criminal' | 'military' | 'academy' | 'secret';

export interface Group {
  id: string;
  campaignId: string;
  name: string;
  type: GroupType;
  aliases: string[];
  description: string;
  goals?: string;
  symbols?: string;
  gmNotes?: string;
  partyRelation?: string;
  createdAt: string;
  updatedAt: string;
}
