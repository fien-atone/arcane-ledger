import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
  LocationTypeConnectionRule,
} from '@/entities/locationType';

const ts = '2026-01-01T00:00:00.000Z';

// ── Type entries ──────────────────────────────────────────────────────────────

export const MOCK_LOCATION_TYPES: LocationTypeEntry[] = [
  { id: 'plane',      name: 'Plane',      icon: 'public',         category: 'world',      biomeOptions: [],                                                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'continent',  name: 'Continent',  icon: 'map',            category: 'world',      biomeOptions: [],                                                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'ocean',      name: 'Ocean / Sea',icon: 'water',          category: 'world',      biomeOptions: ['ocean', 'sea', 'strait', 'gulf'],                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'region',     name: 'Region',     icon: 'terrain',        category: 'geographic', biomeOptions: ['island', 'peninsula'],                                                isSettlement: false, builtin: true, createdAt: ts },
  { id: 'wilderness', name: 'Wilderness', icon: 'forest',         category: 'geographic', biomeOptions: ['forest', 'swamp', 'desert', 'plains', 'tundra', 'jungle', 'badlands', 'savanna'], isSettlement: false, builtin: true, createdAt: ts },
  { id: 'water',      name: 'Water',      icon: 'waves',          category: 'geographic', biomeOptions: ['lake', 'river', 'bay', 'delta', 'marsh'],                             isSettlement: false, builtin: true, createdAt: ts },
  { id: 'highland',   name: 'Highland',   icon: 'landscape',      category: 'geographic', biomeOptions: ['mountain_range', 'peak', 'plateau', 'valley', 'pass'],                isSettlement: false, builtin: true, createdAt: ts },
  { id: 'settlement', name: 'Settlement', icon: 'location_city',  category: 'interior',   biomeOptions: [],                                                                     isSettlement: true,  builtin: true, createdAt: ts },
  { id: 'district',   name: 'District',   icon: 'holiday_village',category: 'interior',   biomeOptions: [],                                                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'building',   name: 'Building',   icon: 'domain',         category: 'interior',   biomeOptions: [],                                                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'dungeon',    name: 'Dungeon',    icon: 'skull',          category: 'explorable', biomeOptions: [],                                                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'landmark',   name: 'Landmark',   icon: 'place',          category: 'explorable', biomeOptions: [],                                                                     isSettlement: false, builtin: true, createdAt: ts },
  { id: 'route',      name: 'Route',      icon: 'route',          category: 'linear',     biomeOptions: ['road', 'trade_route', 'river_route', 'sea_lane', 'mountain_pass', 'tunnel'], isSettlement: false, builtin: true, createdAt: ts },
];

// ── Containment rules (from the matrix in METAMODEL.md) ───────────────────────

function cr(parentTypeId: string, childTypeId: string, idx: number): LocationTypeContainmentRule {
  return { id: `cr-${idx}`, parentTypeId, childTypeId };
}

export const MOCK_CONTAINMENT_RULES: LocationTypeContainmentRule[] = [
  // plane
  cr('plane', 'continent', 0),
  cr('plane', 'ocean',     1),
  cr('plane', 'region',    2),
  // continent
  cr('continent', 'ocean',      3),
  cr('continent', 'region',     4),
  cr('continent', 'wilderness', 5),
  cr('continent', 'water',      6),
  cr('continent', 'highland',   7),
  cr('continent', 'settlement', 8),
  cr('continent', 'dungeon',    9),
  cr('continent', 'landmark',  10),
  cr('continent', 'route',     11),
  // ocean
  cr('ocean', 'ocean',  12),
  cr('ocean', 'region', 13),  // islands
  cr('ocean', 'landmark', 14),
  // region
  cr('region', 'region',     15),
  cr('region', 'wilderness', 16),
  cr('region', 'water',      17),
  cr('region', 'highland',   18),
  cr('region', 'settlement', 19),
  cr('region', 'dungeon',    20),
  cr('region', 'landmark',   21),
  cr('region', 'route',      22),
  // wilderness
  cr('wilderness', 'wilderness', 23),
  cr('wilderness', 'water',      24),
  cr('wilderness', 'settlement', 25),
  cr('wilderness', 'dungeon',    26),
  cr('wilderness', 'landmark',   27),
  cr('wilderness', 'route',      28),
  // water (sub-regional)
  cr('water', 'water',    29),
  cr('water', 'landmark', 30),
  // highland
  cr('highland', 'wilderness', 31),
  cr('highland', 'water',      32),
  cr('highland', 'highland',   33),
  cr('highland', 'settlement', 34),
  cr('highland', 'dungeon',    35),
  cr('highland', 'landmark',   36),
  cr('highland', 'route',      37),
  // settlement
  cr('settlement', 'district',   38),
  cr('settlement', 'building',   39),
  cr('settlement', 'dungeon',    40),
  cr('settlement', 'landmark',   41),
  // district
  cr('district', 'building', 42),
  cr('district', 'dungeon',  43),
  cr('district', 'landmark', 44),
  // building
  cr('building', 'building', 45),
  cr('building', 'dungeon',  46),
  // dungeon
  cr('dungeon', 'dungeon',  47),
  cr('dungeon', 'landmark', 48),
  // landmark
  cr('landmark', 'building', 49),
  cr('landmark', 'dungeon',  50),
  // route
  cr('route', 'landmark', 51),
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

const ALL_CONNECTIONS = ['road', 'path', 'river', 'sea_route', 'border', 'portal', 'tunnel', 'mountain_pass'];

// LocationConnection is unrestricted — any pair can connect.
// We seed sensible defaults but the GM can add/remove pairs and their allowed types.
export const MOCK_CONNECTION_RULES: LocationTypeConnectionRule[] = [
  conr('cnr-1',  'continent', 'ocean',      ['border', 'sea_route']),
  conr('cnr-2',  'continent', 'continent',  ['border', 'road', 'mountain_pass']),
  conr('cnr-3',  'ocean',     'region',     ['sea_route']),             // mainland ↔ island
  conr('cnr-4',  'ocean',     'ocean',      ['sea_route', 'border']),
  conr('cnr-5',  'region',    'region',     ['road', 'river', 'border', 'mountain_pass']),
  conr('cnr-6',  'region',    'ocean',      ['sea_route', 'border']),
  conr('cnr-7',  'region',    'wilderness', ['road', 'path', 'river']),
  conr('cnr-8',  'region',    'highland',   ['road', 'path', 'mountain_pass']),
  conr('cnr-9',  'settlement','settlement', ['road', 'path', 'river']),
  conr('cnr-10', 'settlement','wilderness', ['path', 'river']),
  conr('cnr-11', 'settlement','water',      ['river', 'path']),
  conr('cnr-12', 'settlement','route',      ['road', 'path']),
  conr('cnr-13', 'settlement','dungeon',    ['tunnel', 'path']),
  conr('cnr-14', 'wilderness','wilderness', ['path', 'river']),
  conr('cnr-15', 'wilderness','water',      ['river']),
  conr('cnr-16', 'wilderness','highland',   ['path', 'mountain_pass']),
  conr('cnr-17', 'highland',  'highland',   ['path', 'mountain_pass', 'road']),
  conr('cnr-18', 'dungeon',   'dungeon',    ['tunnel', 'portal']),
  conr('cnr-19', 'dungeon',   'plane',      ['portal']),
  conr('cnr-20', 'building',  'dungeon',    ['tunnel']),
  conr('cnr-21', 'route',     'settlement', ALL_CONNECTIONS),
  conr('cnr-22', 'route',     'region',     ALL_CONNECTIONS),
];
