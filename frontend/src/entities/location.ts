export type LocationType = 'region' | 'settlement' | 'district' | 'building' | 'dungeon';

/** Classification of a settlement by scale */
export type SettlementType = 'village' | 'town' | 'city' | 'metropolis';

export type Climate =
  | 'arctic'
  | 'subarctic'
  | 'temperate'
  | 'continental'
  | 'maritime'
  | 'subtropical'
  | 'tropical'
  | 'arid'
  | 'semi-arid'
  | 'highland';

export interface LocationConnection {
  locationAId: string;
  locationBId: string;
  type?: 'adjacent' | 'route' | 'portal';
  note?: string;
}

export interface MapMarker {
  id: string;
  x: number; // 0–100 percentage of image width
  y: number; // 0–100 percentage of image height
  label: string;
  linkedLocationId?: string;
  linkedNpcId?: string;
}

export interface Location {
  id: string;
  campaignId: string;
  name: string;
  aliases: string[];
  type: LocationType;
  /** Only for type === 'settlement' */
  settlementType?: SettlementType;
  /** Population count — only for type === 'settlement' */
  settlementPopulation?: number;
  /** Only for type === 'region' */
  climate?: Climate;
  parentLocationId?: string;
  adjacentLocationIds?: string[];
  description: string;
  image?: string;
  gmNotes?: string;
  mapMarkers?: MapMarker[];
  createdAt: string;
}
