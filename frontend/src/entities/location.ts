export type LocationType = 'region' | 'settlement' | 'district' | 'building' | 'natural' | 'dungeon';

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
  subtype?: string;
  parentLocationId?: string;
  adjacentLocationIds?: string[];
  description: string;
  image?: string;
  gmNotes?: string;
  mapMarkers?: MapMarker[];
  createdAt: string;
}
