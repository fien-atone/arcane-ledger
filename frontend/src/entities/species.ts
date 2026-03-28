export type SpeciesType =
  | 'humanoid'
  | 'beast'
  | 'undead'
  | 'construct'
  | 'fey'
  | 'fiend'
  | 'celestial'
  | 'dragon'
  | 'elemental'
  | 'giant'
  | 'monstrosity'
  | 'plant'
  | 'ooze'
  | 'aberration';

export type SpeciesSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface Species {
  id: string;
  campaignId: string;
  name: string;
  pluralName?: string;
  type: SpeciesType;
  size: SpeciesSize;
  description?: string;
  traits?: string[];
  image?: string;
  createdAt: string;
}
