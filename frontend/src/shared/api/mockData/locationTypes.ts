import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
  LocationTypeConnectionRule,
} from '@/entities/locationType';

const ts = '2026-01-01T00:00:00.000Z';

// ── Type entries ──────────────────────────────────────────────────────────────

export const MOCK_LOCATION_TYPES: LocationTypeEntry[] = [
  // World-scale (cosmic / planar)
  { id: 'plane',      name: 'Plane',        icon: 'public',           category: 'world',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Geographic — land
  { id: 'continent',  name: 'Continent',    icon: 'map',              category: 'geographic', biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'region',     name: 'Region',       icon: 'terrain',          category: 'geographic', biomeOptions: ['island', 'peninsula', 'cape'],                                                       isSettlement: false, builtin: true, createdAt: ts },
  { id: 'wilderness', name: 'Wilderness',   icon: 'forest',           category: 'geographic', biomeOptions: ['forest', 'desert', 'plains', 'tundra', 'jungle', 'badlands', 'savanna', 'steppe'], isSettlement: false, builtin: true, createdAt: ts },
  { id: 'highland',   name: 'Highland',     icon: 'landscape',        category: 'geographic', biomeOptions: ['mountain_range', 'peak', 'plateau', 'valley', 'pass', 'cliff'],                     isSettlement: false, builtin: true, createdAt: ts },
  // Water bodies
  { id: 'ocean',      name: 'Ocean',        icon: 'waves',            category: 'water',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'river',      name: 'River',        icon: 'stream',           category: 'water',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'lake',       name: 'Lake',         icon: 'water',            category: 'water',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'bay',        name: 'Bay / Gulf',   icon: 'water_full',       category: 'water',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'marsh',      name: 'Marsh / Bog',  icon: 'grass',            category: 'water',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'delta',      name: 'Delta',        icon: 'merge',            category: 'water',      biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Interior
  { id: 'settlement', name: 'Settlement',   icon: 'location_city',    category: 'interior',   biomeOptions: [],                                                                                    isSettlement: true,  builtin: true, createdAt: ts },
  { id: 'district',   name: 'District',     icon: 'holiday_village',  category: 'interior',   biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'building',   name: 'Building',     icon: 'domain',           category: 'interior',   biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Points of interest
  { id: 'dungeon',    name: 'Dungeon',      icon: 'skull',            category: 'poi',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'landmark',   name: 'Landmark',     icon: 'place',            category: 'poi',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Travel
  { id: 'route',      name: 'Route',        icon: 'route',            category: 'travel',     biomeOptions: ['road', 'trade_route', 'river_route', 'sea_lane', 'mountain_pass', 'tunnel'],        isSettlement: false, builtin: true, createdAt: ts },
];

// ── Containment rules ─────────────────────────────────────────────────────────

function cr(parentTypeId: string, childTypeId: string, idx: number): LocationTypeContainmentRule {
  return { id: `cr-${idx}`, parentTypeId, childTypeId };
}

let i = 0;
export const MOCK_CONTAINMENT_RULES: LocationTypeContainmentRule[] = [
  // plane
  cr('plane', 'continent',  i++),
  cr('plane', 'ocean',      i++),
  cr('plane', 'region',     i++),
  // continent
  cr('continent', 'ocean',      i++),
  cr('continent', 'region',     i++),
  cr('continent', 'wilderness', i++),
  cr('continent', 'highland',   i++),
  cr('continent', 'river',      i++),
  cr('continent', 'lake',       i++),
  cr('continent', 'bay',        i++),
  cr('continent', 'marsh',      i++),
  cr('continent', 'delta',      i++),
  cr('continent', 'settlement', i++),
  cr('continent', 'dungeon',    i++),
  cr('continent', 'landmark',   i++),
  cr('continent', 'route',      i++),
  // ocean
  cr('ocean', 'ocean',    i++),
  cr('ocean', 'region',   i++),  // islands
  cr('ocean', 'bay',      i++),
  cr('ocean', 'landmark', i++),
  // region
  cr('region', 'region',     i++),
  cr('region', 'wilderness', i++),
  cr('region', 'highland',   i++),
  cr('region', 'river',      i++),
  cr('region', 'lake',       i++),
  cr('region', 'bay',        i++),
  cr('region', 'marsh',      i++),
  cr('region', 'delta',      i++),
  cr('region', 'settlement', i++),
  cr('region', 'dungeon',    i++),
  cr('region', 'landmark',   i++),
  cr('region', 'route',      i++),
  // wilderness
  cr('wilderness', 'wilderness', i++),
  cr('wilderness', 'river',      i++),
  cr('wilderness', 'lake',       i++),
  cr('wilderness', 'marsh',      i++),
  cr('wilderness', 'settlement', i++),
  cr('wilderness', 'dungeon',    i++),
  cr('wilderness', 'landmark',   i++),
  cr('wilderness', 'route',      i++),
  // highland
  cr('highland', 'wilderness', i++),
  cr('highland', 'highland',   i++),
  cr('highland', 'river',      i++),
  cr('highland', 'lake',       i++),
  cr('highland', 'settlement', i++),
  cr('highland', 'dungeon',    i++),
  cr('highland', 'landmark',   i++),
  cr('highland', 'route',      i++),
  // water bodies
  cr('river',  'delta',    i++),
  cr('river',  'marsh',    i++),
  cr('river',  'landmark', i++),
  cr('lake',   'river',    i++),  // lake outlet
  cr('lake',   'landmark', i++),
  cr('bay',    'landmark', i++),
  cr('marsh',  'river',    i++),
  cr('marsh',  'landmark', i++),
  cr('delta',  'river',    i++),
  cr('delta',  'landmark', i++),
  // settlement
  cr('settlement', 'district',  i++),
  cr('settlement', 'building',  i++),
  cr('settlement', 'dungeon',   i++),
  cr('settlement', 'landmark',  i++),
  // district
  cr('district', 'building', i++),
  cr('district', 'dungeon',  i++),
  cr('district', 'landmark', i++),
  // building
  cr('building', 'building', i++),
  cr('building', 'dungeon',  i++),
  // dungeon
  cr('dungeon', 'dungeon',  i++),
  cr('dungeon', 'landmark', i++),
  // landmark
  cr('landmark', 'building', i++),
  cr('landmark', 'dungeon',  i++),
  // route
  cr('route', 'landmark', i++),
];

// ── Connection rules ──────────────────────────────────────────────────────────

function conr(
  id: string,
  typeAId: string,
  typeBId: string,
  allowed: string[]
): LocationTypeConnectionRule {
  return { id, typeAId, typeBId, allowedConnectionTypes: allowed };
}

const ALL = ['road', 'path', 'river', 'sea_route', 'border', 'portal', 'tunnel', 'mountain_pass'];

export const MOCK_CONNECTION_RULES: LocationTypeConnectionRule[] = [
  // continental / oceanic
  conr('cnr-1',  'continent',  'ocean',      ['border', 'sea_route']),
  conr('cnr-2',  'continent',  'continent',  ['border', 'road', 'mountain_pass']),
  conr('cnr-3',  'ocean',      'region',     ['sea_route']),
  conr('cnr-4',  'ocean',      'ocean',      ['sea_route', 'border']),
  conr('cnr-5',  'ocean',      'bay',        ['sea_route', 'border']),
  // regional / land
  conr('cnr-6',  'region',     'region',     ['road', 'river', 'border', 'mountain_pass']),
  conr('cnr-7',  'region',     'ocean',      ['sea_route', 'border']),
  conr('cnr-8',  'region',     'wilderness', ['road', 'path', 'river']),
  conr('cnr-9',  'region',     'highland',   ['road', 'path', 'mountain_pass']),
  // water connections
  conr('cnr-10', 'river',      'lake',       ['river']),
  conr('cnr-11', 'river',      'river',      ['river']),
  conr('cnr-12', 'river',      'marsh',      ['river']),
  conr('cnr-13', 'river',      'delta',      ['river']),
  conr('cnr-14', 'river',      'ocean',      ['river', 'sea_route']),
  conr('cnr-15', 'river',      'bay',        ['river', 'sea_route']),
  conr('cnr-16', 'lake',       'river',      ['river']),
  conr('cnr-17', 'bay',        'ocean',      ['sea_route', 'border']),
  // settlement connections
  conr('cnr-18', 'settlement', 'settlement', ['road', 'path', 'river']),
  conr('cnr-19', 'settlement', 'wilderness', ['path', 'river']),
  conr('cnr-20', 'settlement', 'river',      ['river', 'path', 'road']),
  conr('cnr-21', 'settlement', 'lake',       ['path', 'road']),
  conr('cnr-22', 'settlement', 'bay',        ['sea_route', 'road']),
  conr('cnr-23', 'settlement', 'route',      ['road', 'path']),
  conr('cnr-24', 'settlement', 'dungeon',    ['tunnel', 'path']),
  // wilderness connections
  conr('cnr-25', 'wilderness', 'wilderness', ['path', 'river']),
  conr('cnr-26', 'wilderness', 'river',      ['river', 'path']),
  conr('cnr-27', 'wilderness', 'lake',       ['path']),
  conr('cnr-28', 'wilderness', 'marsh',      ['path']),
  conr('cnr-29', 'wilderness', 'highland',   ['path', 'mountain_pass']),
  // highland
  conr('cnr-30', 'highland',   'highland',   ['path', 'mountain_pass', 'road']),
  conr('cnr-31', 'highland',   'river',      ['river']),
  // dungeon / poi
  conr('cnr-32', 'dungeon',    'dungeon',    ['tunnel', 'portal']),
  conr('cnr-33', 'dungeon',    'plane',      ['portal']),
  conr('cnr-34', 'building',   'dungeon',    ['tunnel']),
  // route
  conr('cnr-35', 'route',      'settlement', ALL),
  conr('cnr-36', 'route',      'region',     ALL),
];
