export type CharacterGender = 'male' | 'female' | 'nonbinary';

export interface CharacterGroupMembership {
  characterId: string;
  groupId: string;
  relation?: string;
  subfaction?: string;
}

export interface PlayerCharacter {
  id: string;
  campaignId: string;
  userId?: string;
  player?: { id: string; name: string; email: string; avatar?: string };
  name: string;
  gender?: CharacterGender;
  age?: number;
  species?: string;
  speciesId?: string;
  class?: string;
  appearance?: string;
  background?: string;
  personality?: string;
  motivation?: string;
  bonds?: string;
  flaws?: string;
  image?: string;
  gmNotes: string;
  groupMemberships: CharacterGroupMembership[];
  createdAt: string;
  updatedAt?: string;
}
