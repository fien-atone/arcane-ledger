/** Built-in location type IDs — also used as the `type` field on Location */
export type BuiltinLocationType =
  | 'plane'
  | 'continent'
  | 'ocean'
  | 'region'
  | 'wilderness'
  | 'water'
  | 'highland'
  | 'settlement'
  | 'district'
  | 'building'
  | 'dungeon'
  | 'landmark'
  | 'route';

/** Visual category — determines node colour in the graph */
export type LocationTypeCategory =
  | 'world'       // plane, continent, ocean
  | 'geographic'  // region, wilderness, water, highland
  | 'interior'    // settlement, district, building
  | 'poi'         // dungeon, landmark — points of interest
  | 'travel';     // route

export interface LocationTypeEntry {
  id: string;
  name: string;
  icon: string;
  category: LocationTypeCategory;
  /** Which biome options are available for this type (empty = no biome field shown) */
  biomeOptions: string[];
  /** If true, has settlementType / settlementPopulation fields */
  isSettlement: boolean;
  createdAt: string;
  /** Built-in types cannot be deleted, only renamed */
  builtin?: boolean;
}

/** A rule: locations of parentTypeId can contain locations of childTypeId */
export interface LocationTypeContainmentRule {
  id: string;
  parentTypeId: string;
  childTypeId: string;
}

/** A rule: locations of typeAId and typeBId can be linked via LocationConnection */
export interface LocationTypeConnectionRule {
  id: string;
  typeAId: string;
  typeBId: string;
  /** Which connection type labels are valid for this pair */
  allowedConnectionTypes: string[];
}
