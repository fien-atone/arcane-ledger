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
  | 'world'         // plane
  | 'civilization'  // village, town, city, settlement, district, building
  | 'geographic'    // continent, region, wilderness, highland
  | 'water'         // ocean, river, lake, bay, marsh, delta
  | 'poi'           // dungeon, landmark — points of interest
  | 'travel';       // route

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

// ── Category colour maps ───────────────────────────────────────────────────────
// Used by pages/components that render location type icons with colour coding.

/** Human-readable label per category */
export const CATEGORY_LABEL: Record<LocationTypeCategory, string> = {
  world:        'World-scale',
  civilization: 'Civilization',
  geographic:   'Geographic',
  water:        'Water Bodies',
  poi:          'Points of Interest',
  travel:       'Travel',
};

/** Dot colour class per category for Select dropdowns (bg-* Tailwind class) */
export const CATEGORY_DOT_CLS: Record<LocationTypeCategory, string> = {
  world:        'bg-indigo-400',
  civilization: 'bg-amber-400',
  geographic:   'bg-emerald-400',
  water:        'bg-sky-400',
  poi:          'bg-rose-400',
  travel:       'bg-violet-400',
};

/** Icon colour class per category (e.g. text-amber-400) */
export const CATEGORY_ICON_COLOR: Record<LocationTypeCategory, string> = {
  world:        'text-indigo-400',
  civilization: 'text-amber-400',
  geographic:   'text-emerald-400',
  water:        'text-sky-400',
  poi:          'text-rose-400',
  travel:       'text-violet-400',
};

/** Hex colour per category — for inline styles that can't be overridden by CSS cascade */
export const CATEGORY_HEX_COLOR: Record<LocationTypeCategory, string> = {
  world:        '#818cf8', // indigo-400
  civilization: '#fbbf24', // amber-400
  geographic:   '#34d399', // emerald-400
  water:        '#38bdf8', // sky-400
  poi:          '#fb7185', // rose-400
  travel:       '#a78bfa', // violet-400
};

/** Badge (tile bg + text + border) class set per category */
export const CATEGORY_BADGE_CLS: Record<LocationTypeCategory, string> = {
  world:        'text-indigo-300 bg-indigo-950/60 border-indigo-400/25',
  civilization: 'text-amber-300 bg-amber-950/60 border-amber-400/25',
  geographic:   'text-emerald-300 bg-emerald-950/60 border-emerald-400/25',
  water:        'text-sky-300 bg-sky-950/60 border-sky-400/25',
  poi:          'text-rose-300 bg-rose-950/60 border-rose-400/25',
  travel:       'text-violet-300 bg-violet-950/60 border-violet-400/25',
};

/** Icon tile bg class per category */
export const CATEGORY_TILE_CLS: Record<LocationTypeCategory, string> = {
  world:        'bg-indigo-950/40 border-indigo-400/20',
  civilization: 'bg-amber-950/40 border-amber-400/20',
  geographic:   'bg-emerald-950/40 border-emerald-400/20',
  water:        'bg-sky-950/40 border-sky-400/20',
  poi:          'bg-rose-950/40 border-rose-400/20',
  travel:       'bg-violet-950/40 border-violet-400/20',
};

/** A rule: locations of parentTypeId can contain locations of childTypeId */
export interface LocationTypeContainmentRule {
  id: string;
  parentTypeId: string;
  childTypeId: string;
}

