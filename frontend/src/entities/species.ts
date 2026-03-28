export type SpeciesSize = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';

export interface Species {
  id: string;
  campaignId: string;
  name: string;
  pluralName?: string;
  type: string;
  size: SpeciesSize;
  description?: string;
  traits?: string[];
  image?: string;
  createdAt: string;
}
