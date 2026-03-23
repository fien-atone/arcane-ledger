export type CharacterGender = 'male' | 'female' | 'nonbinary';

export interface PlayerCharacter {
  id: string;
  campaignId: string;
  userId: string;
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
  createdAt: string;
  updatedAt?: string;
}
