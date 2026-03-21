export type NpcStatus = 'alive' | 'dead' | 'missing' | 'unknown' | 'hostile';

export type NpcRelationType =
  | 'sibling'
  | 'parent'
  | 'child'
  | 'spouse'
  | 'mentor'
  | 'pupil'
  | 'ally'
  | 'rival'
  | 'acquaintance';

export interface NPCRelation {
  npcId: string;
  type: NpcRelationType;
  note?: string;
}

export interface NPCGroupMembership {
  npcId: string;
  groupId: string;
  relation?: string;
  subfaction?: string;
}

export interface NPC {
  id: string;
  campaignId: string;
  name: string;
  aliases: string[];
  status: NpcStatus;
  species?: string;
  appearance?: string;
  personality?: string;
  lastSeenLocationId?: string;
  locations: string[];
  description: string;
  gmNotes?: string;
  image?: string;
  groupMemberships: NPCGroupMembership[];
  relations?: NPCRelation[];
  motivation?: string;
  flaws?: string;
  createdAt: string;
  updatedAt: string;
}
