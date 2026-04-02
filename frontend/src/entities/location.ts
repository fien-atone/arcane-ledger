/** Broadened to string so the configurable LocationTypeEntry vocabulary is accepted */
export type LocationType = string;

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
  type: LocationType;
  /** Population count — for settlement types (city, town, village, etc.) */
  settlementPopulation?: number;
  /** Terrain/biome sub-type — from the selected LocationTypeEntry's biomeOptions */
  biome?: string;
  parentLocationId?: string;
  adjacentLocationIds?: string[];
  description: string;
  image?: string;
  gmNotes?: string;
  mapMarkers?: MapMarker[];
  playerVisible?: boolean;
  playerVisibleFields?: string[];
  createdAt: string;
}
