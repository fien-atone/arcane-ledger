import type {
  LocationTypeEntry,
  LocationTypeContainmentRule,
} from '@/entities/locationType';

const ts = '2026-01-01T00:00:00.000Z';

// ── Types ──────────────────────────────────────────────────────────────────────

export const MOCK_LOCATION_TYPES: LocationTypeEntry[] = [
  // World
  { id: 'plane',      name: 'Plane',       icon: 'public',          category: 'world',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Civilization
  { id: 'city',       name: 'City',        icon: 'apartment',       category: 'civilization', biomeOptions: [],                                                                                    isSettlement: true,  builtin: true, createdAt: ts },
  { id: 'town',       name: 'Town',        icon: 'location_city',   category: 'civilization', biomeOptions: [],                                                                                    isSettlement: true,  builtin: true, createdAt: ts },
  { id: 'village',    name: 'Village',     icon: 'cottage',         category: 'civilization', biomeOptions: [],                                                                                    isSettlement: true,  builtin: true, createdAt: ts },
  { id: 'settlement', name: 'Settlement',  icon: 'holiday_village', category: 'civilization', biomeOptions: [],                                                                                    isSettlement: true,  builtin: true, createdAt: ts },
  { id: 'district',   name: 'District',    icon: 'domain',          category: 'civilization', biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'building',   name: 'Building',    icon: 'house',           category: 'civilization', biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Geographic
  { id: 'continent',  name: 'Continent',   icon: 'map',             category: 'geographic',   biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'region',     name: 'Region',      icon: 'terrain',         category: 'geographic',   biomeOptions: ['island', 'peninsula', 'cape'],                                                       isSettlement: false, builtin: true, createdAt: ts },
  { id: 'wilderness', name: 'Wilderness',  icon: 'forest',          category: 'geographic',   biomeOptions: ['forest', 'desert', 'plains', 'tundra', 'jungle', 'badlands', 'savanna', 'steppe'], isSettlement: false, builtin: true, createdAt: ts },
  { id: 'highland',   name: 'Highland',    icon: 'landscape',       category: 'geographic',   biomeOptions: ['mountain_range', 'peak', 'plateau', 'valley', 'pass', 'cliff'],                     isSettlement: false, builtin: true, createdAt: ts },
  // Water
  { id: 'ocean',      name: 'Ocean',       icon: 'waves',           category: 'water',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'river',      name: 'River',       icon: 'stream',          category: 'water',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'lake',       name: 'Lake',        icon: 'water',           category: 'water',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'bay',        name: 'Bay / Gulf',  icon: 'water_full',      category: 'water',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'marsh',      name: 'Marsh / Bog', icon: 'grass',           category: 'water',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'delta',      name: 'Delta',       icon: 'merge',           category: 'water',        biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Points of interest
  { id: 'dungeon',    name: 'Dungeon',     icon: 'skull',           category: 'poi',          biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  { id: 'landmark',   name: 'Landmark',    icon: 'place',           category: 'poi',          biomeOptions: [],                                                                                    isSettlement: false, builtin: true, createdAt: ts },
  // Travel
  { id: 'route',      name: 'Route',       icon: 'route',           category: 'travel',       biomeOptions: ['road', 'trade_route', 'river_route', 'sea_lane', 'mountain_pass', 'tunnel'],        isSettlement: false, builtin: true, createdAt: ts },
];

// ── Containment rules ──────────────────────────────────────────────────────────
//
//  Format: { id, parentTypeId, childTypeId }
//  Read as: "<parent> can contain a <child>"

export const MOCK_CONTAINMENT_RULES: LocationTypeContainmentRule[] = [

  // plane → can contain
  { id: 'cr-plane-continent',       parentTypeId: 'plane',      childTypeId: 'continent'  },
  { id: 'cr-plane-ocean',           parentTypeId: 'plane',      childTypeId: 'ocean'      },

  // continent → can contain
  { id: 'cr-cont-ocean',            parentTypeId: 'continent',  childTypeId: 'ocean'      },
  { id: 'cr-cont-region',           parentTypeId: 'continent',  childTypeId: 'region'     },
  { id: 'cr-cont-wilderness',       parentTypeId: 'continent',  childTypeId: 'wilderness' },
  { id: 'cr-cont-highland',         parentTypeId: 'continent',  childTypeId: 'highland'   },
  { id: 'cr-cont-river',            parentTypeId: 'continent',  childTypeId: 'river'      },
  { id: 'cr-cont-lake',             parentTypeId: 'continent',  childTypeId: 'lake'       },
  { id: 'cr-cont-bay',              parentTypeId: 'continent',  childTypeId: 'bay'        },
  { id: 'cr-cont-marsh',            parentTypeId: 'continent',  childTypeId: 'marsh'      },
  { id: 'cr-cont-delta',            parentTypeId: 'continent',  childTypeId: 'delta'      },
  { id: 'cr-cont-city',             parentTypeId: 'continent',  childTypeId: 'city'       },
  { id: 'cr-cont-town',             parentTypeId: 'continent',  childTypeId: 'town'       },
  { id: 'cr-cont-village',          parentTypeId: 'continent',  childTypeId: 'village'    },
  { id: 'cr-cont-settlement',       parentTypeId: 'continent',  childTypeId: 'settlement' },
  { id: 'cr-cont-dungeon',          parentTypeId: 'continent',  childTypeId: 'dungeon'    },
  { id: 'cr-cont-landmark',         parentTypeId: 'continent',  childTypeId: 'landmark'   },
  { id: 'cr-cont-route',            parentTypeId: 'continent',  childTypeId: 'route'      },

  // ocean → can contain
  { id: 'cr-ocean-ocean',           parentTypeId: 'ocean',      childTypeId: 'ocean'      },
  { id: 'cr-ocean-region',          parentTypeId: 'ocean',      childTypeId: 'region'     },
  { id: 'cr-ocean-bay',             parentTypeId: 'ocean',      childTypeId: 'bay'        },
  { id: 'cr-ocean-landmark',        parentTypeId: 'ocean',      childTypeId: 'landmark'   },

  // region → can contain
  { id: 'cr-reg-region',            parentTypeId: 'region',     childTypeId: 'region'     },
  { id: 'cr-reg-wilderness',        parentTypeId: 'region',     childTypeId: 'wilderness' },
  { id: 'cr-reg-highland',          parentTypeId: 'region',     childTypeId: 'highland'   },
  { id: 'cr-reg-river',             parentTypeId: 'region',     childTypeId: 'river'      },
  { id: 'cr-reg-lake',              parentTypeId: 'region',     childTypeId: 'lake'       },
  { id: 'cr-reg-bay',               parentTypeId: 'region',     childTypeId: 'bay'        },
  { id: 'cr-reg-marsh',             parentTypeId: 'region',     childTypeId: 'marsh'      },
  { id: 'cr-reg-delta',             parentTypeId: 'region',     childTypeId: 'delta'      },
  { id: 'cr-reg-city',              parentTypeId: 'region',     childTypeId: 'city'       },
  { id: 'cr-reg-town',              parentTypeId: 'region',     childTypeId: 'town'       },
  { id: 'cr-reg-village',           parentTypeId: 'region',     childTypeId: 'village'    },
  { id: 'cr-reg-settlement',        parentTypeId: 'region',     childTypeId: 'settlement' },
  { id: 'cr-reg-dungeon',           parentTypeId: 'region',     childTypeId: 'dungeon'    },
  { id: 'cr-reg-landmark',          parentTypeId: 'region',     childTypeId: 'landmark'   },
  { id: 'cr-reg-route',             parentTypeId: 'region',     childTypeId: 'route'      },

  // wilderness → can contain
  { id: 'cr-wild-wilderness',       parentTypeId: 'wilderness', childTypeId: 'wilderness' },
  { id: 'cr-wild-river',            parentTypeId: 'wilderness', childTypeId: 'river'      },
  { id: 'cr-wild-lake',             parentTypeId: 'wilderness', childTypeId: 'lake'       },
  { id: 'cr-wild-marsh',            parentTypeId: 'wilderness', childTypeId: 'marsh'      },
  { id: 'cr-wild-village',          parentTypeId: 'wilderness', childTypeId: 'village'    },
  { id: 'cr-wild-settlement',       parentTypeId: 'wilderness', childTypeId: 'settlement' },
  { id: 'cr-wild-dungeon',          parentTypeId: 'wilderness', childTypeId: 'dungeon'    },
  { id: 'cr-wild-landmark',         parentTypeId: 'wilderness', childTypeId: 'landmark'   },
  { id: 'cr-wild-route',            parentTypeId: 'wilderness', childTypeId: 'route'      },

  // highland → can contain
  { id: 'cr-high-wilderness',       parentTypeId: 'highland',   childTypeId: 'wilderness' },
  { id: 'cr-high-highland',         parentTypeId: 'highland',   childTypeId: 'highland'   },
  { id: 'cr-high-river',            parentTypeId: 'highland',   childTypeId: 'river'      },
  { id: 'cr-high-lake',             parentTypeId: 'highland',   childTypeId: 'lake'       },
  { id: 'cr-high-city',             parentTypeId: 'highland',   childTypeId: 'city'       },
  { id: 'cr-high-town',             parentTypeId: 'highland',   childTypeId: 'town'       },
  { id: 'cr-high-village',          parentTypeId: 'highland',   childTypeId: 'village'    },
  { id: 'cr-high-settlement',       parentTypeId: 'highland',   childTypeId: 'settlement' },
  { id: 'cr-high-dungeon',          parentTypeId: 'highland',   childTypeId: 'dungeon'    },
  { id: 'cr-high-landmark',         parentTypeId: 'highland',   childTypeId: 'landmark'   },
  { id: 'cr-high-route',            parentTypeId: 'highland',   childTypeId: 'route'      },

  // water bodies → can contain
  { id: 'cr-river-delta',           parentTypeId: 'river',      childTypeId: 'delta'      },
  { id: 'cr-river-marsh',           parentTypeId: 'river',      childTypeId: 'marsh'      },
  { id: 'cr-river-landmark',        parentTypeId: 'river',      childTypeId: 'landmark'   },
  { id: 'cr-lake-river',            parentTypeId: 'lake',       childTypeId: 'river'      },
  { id: 'cr-lake-landmark',         parentTypeId: 'lake',       childTypeId: 'landmark'   },
  { id: 'cr-bay-landmark',          parentTypeId: 'bay',        childTypeId: 'landmark'   },
  { id: 'cr-marsh-river',           parentTypeId: 'marsh',      childTypeId: 'river'      },
  { id: 'cr-marsh-landmark',        parentTypeId: 'marsh',      childTypeId: 'landmark'   },
  { id: 'cr-delta-river',           parentTypeId: 'delta',      childTypeId: 'river'      },
  { id: 'cr-delta-landmark',        parentTypeId: 'delta',      childTypeId: 'landmark'   },

  // city → can contain
  { id: 'cr-city-district',         parentTypeId: 'city',       childTypeId: 'district'   },
  { id: 'cr-city-building',         parentTypeId: 'city',       childTypeId: 'building'   },
  { id: 'cr-city-dungeon',          parentTypeId: 'city',       childTypeId: 'dungeon'    },
  { id: 'cr-city-landmark',         parentTypeId: 'city',       childTypeId: 'landmark'   },

  // town → can contain
  { id: 'cr-town-district',         parentTypeId: 'town',       childTypeId: 'district'   },
  { id: 'cr-town-building',         parentTypeId: 'town',       childTypeId: 'building'   },
  { id: 'cr-town-dungeon',          parentTypeId: 'town',       childTypeId: 'dungeon'    },
  { id: 'cr-town-landmark',         parentTypeId: 'town',       childTypeId: 'landmark'   },

  // village → can contain
  { id: 'cr-vil-building',          parentTypeId: 'village',    childTypeId: 'building'   },
  { id: 'cr-vil-dungeon',           parentTypeId: 'village',    childTypeId: 'dungeon'    },
  { id: 'cr-vil-landmark',          parentTypeId: 'village',    childTypeId: 'landmark'   },

  // settlement → can contain
  { id: 'cr-sett-district',         parentTypeId: 'settlement', childTypeId: 'district'   },
  { id: 'cr-sett-building',         parentTypeId: 'settlement', childTypeId: 'building'   },
  { id: 'cr-sett-dungeon',          parentTypeId: 'settlement', childTypeId: 'dungeon'    },
  { id: 'cr-sett-landmark',         parentTypeId: 'settlement', childTypeId: 'landmark'   },

  // district → can contain
  { id: 'cr-dist-building',         parentTypeId: 'district',   childTypeId: 'building'   },
  { id: 'cr-dist-dungeon',          parentTypeId: 'district',   childTypeId: 'dungeon'    },
  { id: 'cr-dist-landmark',         parentTypeId: 'district',   childTypeId: 'landmark'   },

  // building → can contain
  { id: 'cr-bld-building',          parentTypeId: 'building',   childTypeId: 'building'   },
  { id: 'cr-bld-dungeon',           parentTypeId: 'building',   childTypeId: 'dungeon'    },

  // dungeon → can contain
  { id: 'cr-dun-dungeon',           parentTypeId: 'dungeon',    childTypeId: 'dungeon'    },
  { id: 'cr-dun-landmark',          parentTypeId: 'dungeon',    childTypeId: 'landmark'   },

  // landmark → can contain
  { id: 'cr-lmk-building',          parentTypeId: 'landmark',   childTypeId: 'building'   },
  { id: 'cr-lmk-dungeon',           parentTypeId: 'landmark',   childTypeId: 'dungeon'    },

  // route → can contain
  { id: 'cr-route-landmark',        parentTypeId: 'route',      childTypeId: 'landmark'   },
];

