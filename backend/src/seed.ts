import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ══════════════════════════════════════════════════════════════════════════════
//  Arcane Ledger — Full Seed Script
//  Both campaigns: Farchester + Drakkenheim
//  Idempotent: clears all data and re-seeds from scratch
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('Clearing existing data...');

  // Delete in FK-safe order (children first)
  await prisma.$transaction([
    prisma.sessionQuest.deleteMany(),
    prisma.sessionNPC.deleteMany(),
    prisma.sessionLocation.deleteMany(),
    prisma.nPCGroupMembership.deleteMany(),
    prisma.nPCLocationPresence.deleteMany(),
    prisma.relation.deleteMany(),
    prisma.quest.deleteMany(),
    prisma.session.deleteMany(),
    prisma.nPC.deleteMany(),
    prisma.playerCharacter.deleteMany(),
    prisma.group.deleteMany(),
    prisma.location.deleteMany(),
    prisma.species.deleteMany(),
    prisma.speciesType.deleteMany(),
    prisma.groupType.deleteMany(),
    prisma.locationType.deleteMany(),
    prisma.locationTypeContainmentRule.deleteMany(),
    prisma.campaignMember.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Seeding users...');

  // ── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('user', 10);

  const userGm = await prisma.user.create({
    data: { id: 'user-gm', email: 'gm@arcaneledger.app', password: passwordHash, name: 'Game Master' },
  });

  const userIvan = await prisma.user.create({
    data: { id: 'user-ivan', email: 'ivan@arcaneledger.app', password: passwordHash, name: 'Ivan' },
  });
  const userSeva = await prisma.user.create({
    data: { id: 'user-seva', email: 'seva@arcaneledger.app', password: passwordHash, name: 'Seva' },
  });
  const userElya = await prisma.user.create({
    data: { id: 'user-elya', email: 'elya@arcaneledger.app', password: passwordHash, name: 'Elya' },
  });
  const userZhenya = await prisma.user.create({
    data: { id: 'user-zhenya', email: 'zhenya@arcaneledger.app', password: passwordHash, name: 'Zhenya' },
  });
  const userSergey = await prisma.user.create({
    data: { id: 'user-sergey', email: 'sergey@arcaneledger.app', password: passwordHash, name: 'Sergey' },
  });
  const userAdel = await prisma.user.create({
    data: { id: 'user-adel', email: 'adel@arcaneledger.app', password: passwordHash, name: 'Adel' },
  });
  const userNatasha = await prisma.user.create({
    data: { id: 'user-natasha', email: 'natasha@arcaneledger.app', password: passwordHash, name: 'Natasha' },
  });
  const userJess = await prisma.user.create({
    data: { id: 'user-jess', email: 'jess@arcaneledger.app', password: passwordHash, name: 'Jess' },
  });

  console.log('Seeding campaigns...');

  // ── Campaigns ─────────────────────────────────────────────────────────────
  const campaignFc = await prisma.campaign.create({
    data: {
      id: 'campaign-farchester',
      title: 'Farchester',
      description: 'City intrigue under a dry law and curfew. 5000 gold missing from the treasury. Goblins at the eastern gate, elves at the western. The party operates undercover.',
      enabledSections: ['SESSIONS', 'NPCS', 'LOCATIONS', 'GROUPS', 'QUESTS', 'PARTY', 'SOCIAL_GRAPH', 'SPECIES'],
      createdAt: new Date('2026-02-01T00:00:00Z'),
    },
  });

  const campaignDk = await prisma.campaign.create({
    data: {
      id: 'campaign-drakkenheim',
      title: 'Drakkenheim',
      description: 'A ruined city blanketed in deliriite. Five factions fight for control. The party navigates the underground district of Bent Row and the delirium-soaked streets above.',
      enabledSections: ['SESSIONS', 'NPCS', 'LOCATIONS', 'GROUPS', 'QUESTS', 'PARTY', 'SOCIAL_GRAPH', 'SPECIES'],
      createdAt: new Date('2025-09-01T00:00:00Z'),
    },
  });

  // ── Campaign Members ──────────────────────────────────────────────────────
  // Farchester: GM + 5 players
  await prisma.campaignMember.createMany({
    data: [
      { campaignId: 'campaign-farchester', userId: 'user-gm', role: 'GM' },
      { campaignId: 'campaign-farchester', userId: 'user-ivan', role: 'PLAYER' },
      { campaignId: 'campaign-farchester', userId: 'user-seva', role: 'PLAYER' },
      { campaignId: 'campaign-farchester', userId: 'user-elya', role: 'PLAYER' },
      { campaignId: 'campaign-farchester', userId: 'user-zhenya', role: 'PLAYER' },
      { campaignId: 'campaign-farchester', userId: 'user-sergey', role: 'PLAYER' },
    ],
  });

  // Drakkenheim: GM + 4 players
  await prisma.campaignMember.createMany({
    data: [
      { campaignId: 'campaign-drakkenheim', userId: 'user-gm', role: 'GM' },
      { campaignId: 'campaign-drakkenheim', userId: 'user-ivan', role: 'PLAYER' },
      { campaignId: 'campaign-drakkenheim', userId: 'user-adel', role: 'PLAYER' },
      { campaignId: 'campaign-drakkenheim', userId: 'user-natasha', role: 'PLAYER' },
      { campaignId: 'campaign-drakkenheim', userId: 'user-jess', role: 'PLAYER' },
    ],
  });

  console.log('Seeding reference data...');

  // ── Species Types (per-campaign) ──────────────────────────────────────────
  // Standard D&D-style species types for both campaigns
  const speciesTypeData = [
    { id: 'st-humanoid', name: 'Humanoid', icon: 'person', description: 'Bipedal creatures of human-like form.' },
    { id: 'st-beast', name: 'Beast', icon: 'pets', description: 'Natural animals and wildlife.' },
    { id: 'st-undead', name: 'Undead', icon: 'skull', description: 'Once-living creatures animated by dark magic.' },
    { id: 'st-construct', name: 'Construct', icon: 'precision_manufacturing', description: 'Artificial beings created by magic or craft.' },
    { id: 'st-aberration', name: 'Aberration', icon: 'blur_on', description: 'Alien entities from beyond the known planes.' },
    { id: 'st-fiend', name: 'Fiend', icon: 'whatshot', description: 'Creatures of the lower planes.' },
    { id: 'st-celestial', name: 'Celestial', icon: 'auto_awesome', description: 'Beings of the upper planes.' },
    { id: 'st-elemental', name: 'Elemental', icon: 'thunderstorm', description: 'Beings composed of raw elemental energy.' },
    { id: 'st-monstrosity', name: 'Monstrosity', icon: 'bug_report', description: 'Unnatural creatures born of magic or twisted nature.' },
    { id: 'st-fey', name: 'Fey', icon: 'forest', description: 'Magical creatures tied to the Feywild.' },
  ];

  for (const campId of ['campaign-farchester', 'campaign-drakkenheim']) {
    for (const st of speciesTypeData) {
      await prisma.speciesType.create({
        data: { id: `${st.id}-${campId === 'campaign-farchester' ? 'fc' : 'dk'}`, campaignId: campId, name: st.name, icon: st.icon, description: st.description },
      });
    }
  }

  // ── Group Types (per-campaign) ────────────────────────────────────────────
  const groupTypeData = [
    { id: 'faction', name: 'Faction', icon: 'flag', description: 'Political or military powers vying for control.' },
    { id: 'guild', name: 'Guild', icon: 'handshake', description: 'Professional organisations united by trade or craft.' },
    { id: 'family', name: 'Family', icon: 'family_restroom', description: 'Blood-related or adopted kin.' },
    { id: 'religion', name: 'Religion', icon: 'auto_awesome', description: 'Faiths, cults, and divine orders.' },
    { id: 'criminal', name: 'Criminal Org.', icon: 'warning', description: 'Underworld syndicates and illicit networks.' },
    { id: 'military', name: 'Military / Order', icon: 'military_tech', description: 'Armed forces, knightly orders, and mercenary companies.' },
    { id: 'academy', name: 'Academy', icon: 'school', description: 'Institutions of learning and magical research.' },
    { id: 'secret', name: 'Secret Society', icon: 'visibility_off', description: 'Hidden organisations operating in the shadows.' },
  ];

  for (const campId of ['campaign-farchester', 'campaign-drakkenheim']) {
    const suffix = campId === 'campaign-farchester' ? 'fc' : 'dk';
    for (const gt of groupTypeData) {
      await prisma.groupType.create({
        data: { id: `${gt.id}-${suffix}`, campaignId: campId, name: gt.name, icon: gt.icon, description: gt.description },
      });
    }
  }

  // ── Location Types (per-campaign) ─────────────────────────────────────────
  const locationTypeData = [
    { id: 'plane', name: 'Plane', icon: 'public', category: 'world', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'city', name: 'City', icon: 'apartment', category: 'civilization', biomeOptions: [] as string[], isSettlement: true, builtin: true },
    { id: 'town', name: 'Town', icon: 'location_city', category: 'civilization', biomeOptions: [] as string[], isSettlement: true, builtin: true },
    { id: 'village', name: 'Village', icon: 'cottage', category: 'civilization', biomeOptions: [] as string[], isSettlement: true, builtin: true },
    { id: 'settlement', name: 'Settlement', icon: 'holiday_village', category: 'civilization', biomeOptions: [] as string[], isSettlement: true, builtin: true },
    { id: 'district', name: 'District', icon: 'domain', category: 'civilization', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'building', name: 'Building', icon: 'house', category: 'civilization', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'continent', name: 'Continent', icon: 'map', category: 'geographic', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'region', name: 'Region', icon: 'terrain', category: 'geographic', biomeOptions: ['island', 'peninsula', 'cape'], isSettlement: false, builtin: true },
    { id: 'wilderness', name: 'Wilderness', icon: 'forest', category: 'geographic', biomeOptions: ['forest', 'desert', 'plains', 'tundra', 'jungle', 'badlands', 'savanna', 'steppe'], isSettlement: false, builtin: true },
    { id: 'highland', name: 'Highland', icon: 'landscape', category: 'geographic', biomeOptions: ['mountain_range', 'peak', 'plateau', 'valley', 'pass', 'cliff'], isSettlement: false, builtin: true },
    { id: 'ocean', name: 'Ocean', icon: 'waves', category: 'water', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'river', name: 'River', icon: 'stream', category: 'water', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'lake', name: 'Lake', icon: 'water', category: 'water', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'bay', name: 'Bay / Gulf', icon: 'water_full', category: 'water', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'marsh', name: 'Marsh / Bog', icon: 'grass', category: 'water', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'delta', name: 'Delta', icon: 'merge', category: 'water', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'dungeon', name: 'Dungeon', icon: 'skull', category: 'poi', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'landmark', name: 'Landmark', icon: 'place', category: 'poi', biomeOptions: [] as string[], isSettlement: false, builtin: true },
    { id: 'route', name: 'Route', icon: 'route', category: 'travel', biomeOptions: ['road', 'trade_route', 'river_route', 'sea_lane', 'mountain_pass', 'tunnel'], isSettlement: false, builtin: true },
  ];

  for (const campId of ['campaign-farchester', 'campaign-drakkenheim']) {
    const suffix = campId === 'campaign-farchester' ? 'fc' : 'dk';
    for (const lt of locationTypeData) {
      await prisma.locationType.create({
        data: {
          id: `${lt.id}-${suffix}`,
          campaignId: campId,
          name: lt.name,
          icon: lt.icon,
          category: lt.category,
          biomeOptions: lt.biomeOptions,
          isSettlement: lt.isSettlement,
          builtin: lt.builtin,
        },
      });
    }
  }

  // ── Containment Rules ─────────────────────────────────────────────────────
  const containmentRules = [
    { parentTypeId: 'plane', childTypeId: 'continent' },
    { parentTypeId: 'plane', childTypeId: 'ocean' },
    { parentTypeId: 'continent', childTypeId: 'ocean' },
    { parentTypeId: 'continent', childTypeId: 'region' },
    { parentTypeId: 'continent', childTypeId: 'wilderness' },
    { parentTypeId: 'continent', childTypeId: 'highland' },
    { parentTypeId: 'continent', childTypeId: 'river' },
    { parentTypeId: 'continent', childTypeId: 'lake' },
    { parentTypeId: 'continent', childTypeId: 'bay' },
    { parentTypeId: 'continent', childTypeId: 'marsh' },
    { parentTypeId: 'continent', childTypeId: 'delta' },
    { parentTypeId: 'continent', childTypeId: 'city' },
    { parentTypeId: 'continent', childTypeId: 'town' },
    { parentTypeId: 'continent', childTypeId: 'village' },
    { parentTypeId: 'continent', childTypeId: 'settlement' },
    { parentTypeId: 'continent', childTypeId: 'dungeon' },
    { parentTypeId: 'continent', childTypeId: 'landmark' },
    { parentTypeId: 'continent', childTypeId: 'route' },
    { parentTypeId: 'ocean', childTypeId: 'ocean' },
    { parentTypeId: 'ocean', childTypeId: 'region' },
    { parentTypeId: 'ocean', childTypeId: 'bay' },
    { parentTypeId: 'ocean', childTypeId: 'landmark' },
    { parentTypeId: 'region', childTypeId: 'region' },
    { parentTypeId: 'region', childTypeId: 'wilderness' },
    { parentTypeId: 'region', childTypeId: 'highland' },
    { parentTypeId: 'region', childTypeId: 'river' },
    { parentTypeId: 'region', childTypeId: 'lake' },
    { parentTypeId: 'region', childTypeId: 'bay' },
    { parentTypeId: 'region', childTypeId: 'marsh' },
    { parentTypeId: 'region', childTypeId: 'delta' },
    { parentTypeId: 'region', childTypeId: 'city' },
    { parentTypeId: 'region', childTypeId: 'town' },
    { parentTypeId: 'region', childTypeId: 'village' },
    { parentTypeId: 'region', childTypeId: 'settlement' },
    { parentTypeId: 'region', childTypeId: 'dungeon' },
    { parentTypeId: 'region', childTypeId: 'landmark' },
    { parentTypeId: 'region', childTypeId: 'route' },
    { parentTypeId: 'wilderness', childTypeId: 'wilderness' },
    { parentTypeId: 'wilderness', childTypeId: 'river' },
    { parentTypeId: 'wilderness', childTypeId: 'lake' },
    { parentTypeId: 'wilderness', childTypeId: 'marsh' },
    { parentTypeId: 'wilderness', childTypeId: 'village' },
    { parentTypeId: 'wilderness', childTypeId: 'settlement' },
    { parentTypeId: 'wilderness', childTypeId: 'dungeon' },
    { parentTypeId: 'wilderness', childTypeId: 'landmark' },
    { parentTypeId: 'wilderness', childTypeId: 'route' },
    { parentTypeId: 'highland', childTypeId: 'wilderness' },
    { parentTypeId: 'highland', childTypeId: 'highland' },
    { parentTypeId: 'highland', childTypeId: 'river' },
    { parentTypeId: 'highland', childTypeId: 'lake' },
    { parentTypeId: 'highland', childTypeId: 'city' },
    { parentTypeId: 'highland', childTypeId: 'town' },
    { parentTypeId: 'highland', childTypeId: 'village' },
    { parentTypeId: 'highland', childTypeId: 'settlement' },
    { parentTypeId: 'highland', childTypeId: 'dungeon' },
    { parentTypeId: 'highland', childTypeId: 'landmark' },
    { parentTypeId: 'highland', childTypeId: 'route' },
    { parentTypeId: 'river', childTypeId: 'delta' },
    { parentTypeId: 'river', childTypeId: 'marsh' },
    { parentTypeId: 'river', childTypeId: 'landmark' },
    { parentTypeId: 'lake', childTypeId: 'river' },
    { parentTypeId: 'lake', childTypeId: 'landmark' },
    { parentTypeId: 'bay', childTypeId: 'landmark' },
    { parentTypeId: 'marsh', childTypeId: 'river' },
    { parentTypeId: 'marsh', childTypeId: 'landmark' },
    { parentTypeId: 'delta', childTypeId: 'river' },
    { parentTypeId: 'delta', childTypeId: 'landmark' },
    { parentTypeId: 'city', childTypeId: 'district' },
    { parentTypeId: 'city', childTypeId: 'building' },
    { parentTypeId: 'city', childTypeId: 'dungeon' },
    { parentTypeId: 'city', childTypeId: 'landmark' },
    { parentTypeId: 'town', childTypeId: 'district' },
    { parentTypeId: 'town', childTypeId: 'building' },
    { parentTypeId: 'town', childTypeId: 'dungeon' },
    { parentTypeId: 'town', childTypeId: 'landmark' },
    { parentTypeId: 'village', childTypeId: 'building' },
    { parentTypeId: 'village', childTypeId: 'dungeon' },
    { parentTypeId: 'village', childTypeId: 'landmark' },
    { parentTypeId: 'settlement', childTypeId: 'district' },
    { parentTypeId: 'settlement', childTypeId: 'building' },
    { parentTypeId: 'settlement', childTypeId: 'dungeon' },
    { parentTypeId: 'settlement', childTypeId: 'landmark' },
    { parentTypeId: 'district', childTypeId: 'building' },
    { parentTypeId: 'district', childTypeId: 'dungeon' },
    { parentTypeId: 'district', childTypeId: 'landmark' },
    { parentTypeId: 'building', childTypeId: 'building' },
    { parentTypeId: 'building', childTypeId: 'dungeon' },
    { parentTypeId: 'dungeon', childTypeId: 'dungeon' },
    { parentTypeId: 'dungeon', childTypeId: 'landmark' },
    { parentTypeId: 'landmark', childTypeId: 'building' },
    { parentTypeId: 'landmark', childTypeId: 'dungeon' },
    { parentTypeId: 'route', childTypeId: 'landmark' },
  ];

  let crIdx = 0;
  for (const campId of ['campaign-farchester', 'campaign-drakkenheim']) {
    const suffix = campId === 'campaign-farchester' ? 'fc' : 'dk';
    for (const cr of containmentRules) {
      crIdx++;
      await prisma.locationTypeContainmentRule.create({
        data: { id: `cr-${crIdx}`, parentTypeId: `${cr.parentTypeId}-${suffix}`, childTypeId: `${cr.childTypeId}-${suffix}` },
      });
    }
  }

  // ── Species (per-campaign) ────────────────────────────────────────────────
  const speciesData = [
    { id: 'species-human', name: 'Human', pluralName: 'Humans', type: 'humanoid', size: 'medium', description: 'Humans are the most widespread and adaptable of the common races.', traits: ['Versatile', 'Ambitious', 'Adaptable'] },
    { id: 'species-elf', name: 'Elf', pluralName: 'Elves', type: 'humanoid', size: 'medium', description: 'Elves are a magical people of otherworldly grace, long-lived and deeply tied to nature.', traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'] },
    { id: 'species-dwarf', name: 'Dwarf', pluralName: 'Dwarves', type: 'humanoid', size: 'medium', description: 'Dwarves are a hardy, stoic people forged in the deep places of the world.', traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'] },
    { id: 'species-halfling', name: 'Halfling', pluralName: 'Halflings', type: 'humanoid', size: 'small', description: 'Halflings are small, practical folk with a remarkable talent for luck.', traits: ['Lucky', 'Brave', 'Nimbleness'] },
    { id: 'species-gnome', name: 'Gnome', pluralName: 'Gnomes', type: 'humanoid', size: 'small', description: 'Gnomes are quick-witted, inventive, and curious beyond measure.', traits: ['Darkvision', 'Gnome Cunning'] },
    { id: 'species-half-elf', name: 'Half-Elf', pluralName: 'Half-Elves', type: 'humanoid', size: 'medium', description: 'Half-elves combine the best qualities of their human and elven heritage.', traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'] },
    { id: 'species-half-orc', name: 'Half-Orc', pluralName: 'Half-Orcs', type: 'humanoid', size: 'medium', description: 'Half-orcs inherit physical power from their orc heritage.', traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'] },
    { id: 'species-tiefling', name: 'Tiefling', pluralName: 'Tieflings', type: 'humanoid', size: 'medium', description: 'Tieflings bear the infernal mark of fiendish ancestry.', traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'] },
    { id: 'species-dragonborn', name: 'Dragonborn', pluralName: 'Dragonborn', type: 'humanoid', size: 'medium', description: 'Born of draconic lineage, dragonborn carry within them the power of dragons.', traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'] },
    { id: 'species-goblin', name: 'Goblin', pluralName: 'Goblins', type: 'humanoid', size: 'small', description: 'Small and cunning, goblins are survivors who make the most of meager resources.', traits: ['Darkvision', 'Nimble Escape', 'Fury of the Small'] },
  ];

  for (const campId of ['campaign-farchester', 'campaign-drakkenheim']) {
    const suffix = campId === 'campaign-farchester' ? 'fc' : 'dk';
    for (const sp of speciesData) {
      await prisma.species.create({
        data: {
          id: `${sp.id}-${suffix}`,
          campaignId: campId,
          name: sp.name,
          pluralName: sp.pluralName,
          type: sp.type,
          size: sp.size,
          description: sp.description,
          traits: sp.traits,
        },
      });
    }
  }

  console.log('Seeding locations...');

  // ══════════════════════════════════════════════════════════════════════════
  //  LOCATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // Farchester locations — create parents first, then children
  await prisma.location.create({
    data: {
      id: 'loc-fc-farchester', campaignId: 'campaign-farchester', name: 'Farchester',
      aliases: ['Farchester'], type: 'city-fc', settlementPopulation: 12000,
      description: 'City under dry law and curfew. Two factions: Red (Imperial, Kronhev) and Blue (City, Stoungriv). Eastern gate — goblin protesters, western gate — elf camp. River drying up.',
      gmNotes: 'City under pressure — important for the campaign. Track the balance of power between Kronhev and the Burgmaster.',
      createdAt: new Date('2026-02-01T00:00:00Z'),
    },
  });

  await prisma.location.createMany({
    data: [
      {
        id: 'loc-fc-rathusha', campaignId: 'campaign-farchester', name: 'Rathusha',
        aliases: ['Town Hall'], type: 'building-fc', parentLocationId: 'loc-fc-farchester',
        description: 'Central town hall. Meeting place with Burgmaster Stoungriv. Fountain nearby.',
        createdAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'loc-fc-residence', campaignId: 'campaign-farchester', name: 'Kronhev Residence',
        aliases: ["Kronhev's Residence"], type: 'building-fc', parentLocationId: 'loc-fc-farchester',
        description: 'Large house with garden, many red guards. Residence of Lord-Admiral Kronhev.',
        createdAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'loc-fc-tavern', campaignId: 'campaign-farchester', name: 'Y Kuru Ayr Tavern',
        aliases: ['Y Kuru Ayr', 'The Tavern'], type: 'building-fc', parentLocationId: 'loc-fc-farchester',
        description: 'Tavern where the party is staying. Innkeeper Yorvert. Place for rest and planning.',
        createdAt: new Date('2026-02-20T00:00:00Z'),
      },
      {
        id: 'loc-fc-tower', campaignId: 'campaign-farchester', name: "Mage's Tower",
        aliases: ["Mage's Tower", "Tuts' Tower"], type: 'building-fc', parentLocationId: 'loc-fc-farchester',
        description: "Tower of the city mage Tuts. Battered but functional. Ground floor for very large creatures, second floor — enormous number of clocks. Stone terrier guard with riddles.",
        createdAt: new Date('2026-03-02T00:00:00Z'),
      },
    ],
  });

  // Drakkenheim locations — create in hierarchy order
  // Top-level regions first
  await prisma.location.create({
    data: {
      id: 'loc-dk-region', campaignId: 'campaign-drakkenheim', name: 'Drakkenheim Region',
      aliases: ['Drakkenheim Region'], type: 'region-dk',
      description: 'The broader region surrounding the ruined city of Drakkenheim. Delirium contamination spreads outward from the crater.',
      createdAt: new Date('2025-09-01T00:00:00Z'),
    },
  });

  await prisma.location.create({
    data: {
      id: 'loc-dk-emberwood-region', campaignId: 'campaign-drakkenheim', name: 'Emberwood Village Region',
      aliases: ['Emberwood Region'], type: 'region-dk', parentLocationId: 'loc-dk-region',
      description: 'Region around Emberwood — relatively safe zone away from delirium.',
      createdAt: new Date('2025-09-01T00:00:00Z'),
    },
  });

  // Emberwood region children
  await prisma.location.createMany({
    data: [
      {
        id: 'loc-dk-road', campaignId: 'campaign-drakkenheim', name: 'Road to Emberwood',
        aliases: ['Road to Emberwood'], type: 'district-dk', parentLocationId: 'loc-dk-emberwood-region',
        description: 'The road leading to Emberwood Village. First session: party encountered a corpse near the Dran river, Rikard Vos touched delirium and transformed.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-zoya-house', campaignId: 'campaign-drakkenheim', name: 'Zoya House',
        aliases: ['Zoya House'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood-region',
        description: "Zoya's secluded house in the woods near Emberwood. The old woman sells amber beads and worships the Old Gods. A place of mystery and folk magic.",
        createdAt: new Date('2025-11-07T00:00:00Z'),
      },
      {
        id: 'loc-dk-eckerman-mill', campaignId: 'campaign-drakkenheim', name: 'Eckerman Mill',
        aliases: ['Eckerman Mill'], type: 'building-dk', parentLocationId: 'loc-dk-region',
        description: 'Mill outside Drakkenheim and Emberwood. Nearby — an abandoned mansion, meeting point with suspicious figure selling contaminated potions (Lanterns quest).',
        createdAt: new Date('2025-11-07T00:00:00Z'),
      },
    ],
  });

  // Emberwood Village
  await prisma.location.create({
    data: {
      id: 'loc-dk-emberwood', campaignId: 'campaign-drakkenheim', name: 'Emberwood Village',
      aliases: ['Emberwood', 'Emberwood'], type: 'village-dk', settlementPopulation: 340,
      parentLocationId: 'loc-dk-emberwood-region',
      description: 'Starting village, party base. In turmoil but relatively safe.',
      createdAt: new Date('2025-09-01T00:00:00Z'),
    },
  });

  // Emberwood Village children
  await prisma.location.createMany({
    data: [
      {
        id: 'loc-dk-marketplace', campaignId: 'campaign-drakkenheim', name: 'Marketplace',
        aliases: ['Emberwood Market'], type: 'district-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Night market in Emberwood. Traders: Eren Marlow (supplies), Aldor (magic items), Orson Fairweather (delirium), Armin Gainsbury (adventuring gear).',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-bark', campaignId: 'campaign-drakkenheim', name: 'Bark and Buzzard',
        aliases: ['Bark and Buzzard'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Recommended tavern. Food 1gp, room 2gp per person. Owner — Karin Alsberg.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-skull', campaignId: 'campaign-drakkenheim', name: 'Skull and Sword Taphouse',
        aliases: ['Skull and Sword'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: "Queen's Men tavern. Suspicious atmosphere. Place for contacts with Queen's Men.",
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-red-lion', campaignId: 'campaign-drakkenheim', name: 'Red Lion Hotel',
        aliases: ['Red Lion'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Hotel in Emberwood. River spends evenings in the private library. Former owner Kosta Stavros — killed by a doppelganger.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-gilded-lily', campaignId: 'campaign-drakkenheim', name: 'Gilded Lily',
        aliases: ['Gilded Lily'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Owned by Madam Rochelle. Grogs for 1gp, live music evenings. Open mic nights.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-smithy', campaignId: 'campaign-drakkenheim', name: 'Crowe and Sons Smithy',
        aliases: ['Crowe Smithy'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Tobias Crowe smithy. Expensive but custom-made.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-chapel', campaignId: 'campaign-drakkenheim', name: 'Chapel of Saint Ardenna',
        aliases: ['Chapel of Saint Ardenna'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Base of the Knights of the Silver Order in Emberwood. Center of the Sacred Flame.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-watchtower', campaignId: 'campaign-drakkenheim', name: 'Emberwood Watchtower',
        aliases: ['Watchtower', 'Lantern Tower'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Hooded Lanterns tower — tallest structure in the village. Guard at the bridge, delirium contamination check. Watch captain — Raine Highlash.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'loc-dk-old-rattlecan', campaignId: 'campaign-drakkenheim', name: 'Old Rattlecan',
        aliases: ['Old Rattlecan'], type: 'building-dk', parentLocationId: 'loc-dk-emberwood',
        description: 'Animated armor in the backyard of Bark and Buzzard. Local entertainment. In session 3 locals climbed it — Patrikeyevna got hit. Creator unknown.',
        createdAt: new Date('2025-09-23T00:00:00Z'),
      },
    ],
  });

  // Drakkenheim City
  await prisma.location.create({
    data: {
      id: 'loc-dk-city', campaignId: 'campaign-drakkenheim', name: 'Drakkenheim',
      aliases: ['Drakkenheim'], type: 'city-dk', settlementPopulation: 40000,
      parentLocationId: 'loc-dk-region',
      description: 'Ruined city. Meteorite impact site with delirium. Extremely dangerous: contamination, monsters, Tainted. Dran river — safe zone boundary.',
      createdAt: new Date('2025-09-01T00:00:00Z'),
    },
  });

  // Drakkenheim City children
  await prisma.location.createMany({
    data: [
      {
        id: 'loc-dk-house-copperpot', campaignId: 'campaign-drakkenheim', name: "House with Copperpot's Corpse",
        aliases: ["Copperpot's House"], type: 'building-dk', parentLocationId: 'loc-dk-city',
        description: 'Place in Drakkenheim with the corpse of Coxworth B. Copperpot. Contains: broken teleportation circle, hidden note in unknown language (undeciphered), wall inscription.',
        createdAt: new Date('2025-10-15T00:00:00Z'),
      },
      {
        id: 'loc-dk-champions-gate', campaignId: 'campaign-drakkenheim', name: "Champion's Gate",
        aliases: ["Champion's Gate"], type: 'building-dk', parentLocationId: 'loc-dk-city',
        description: 'Gate in Drakkenheim — gathering place of Followers of the Falling Fire cultists. Lucretia Mathias is stationed here.',
        createdAt: new Date('2026-01-08T00:00:00Z'),
      },
      {
        id: 'loc-dk-rat-nest', campaignId: 'campaign-drakkenheim', name: 'Rat Nest',
        aliases: ['Rat Nest'], type: 'dungeon-dk', parentLocationId: 'loc-dk-city',
        description: 'Rat nest in Drakkenheim ruins. Petra Lang was held here. Cleared by the party.',
        createdAt: new Date('2025-10-01T00:00:00Z'),
      },
    ],
  });

  // Bent Row district
  await prisma.location.create({
    data: {
      id: 'loc-dk-bent-row', campaignId: 'campaign-drakkenheim', name: 'Bent Row',
      aliases: ['Bent Row'], type: 'district-dk', parentLocationId: 'loc-dk-city',
      description: "Underground district of Drakkenheim in the Spire District beyond the Rat Nest. Lair of several Queen's Men groups: Sewer Cobras, Rose and Thorns, Wounded Hearts.",
      createdAt: new Date('2025-09-01T00:00:00Z'),
    },
  });

  // Bent Row sub-locations
  await prisma.location.createMany({
    data: [
      {
        id: 'loc-dk-old-imperial-pub', campaignId: 'campaign-drakkenheim', name: 'Old Imperial Pub',
        aliases: ['Old Imperial Pub'], type: 'building-dk', parentLocationId: 'loc-dk-bent-row',
        description: "Underground tavern in Bent Row. Base of 'Rose and Thorns' Queen's Men faction. Owned by Rosa Carver, bartender — Izrael.",
        createdAt: new Date('2026-01-15T00:00:00Z'),
      },
      {
        id: 'loc-dk-sweaty-bugbear', campaignId: 'campaign-drakkenheim', name: 'Sweaty Bugbear',
        aliases: ['Sweaty Bugbear'], type: 'building-dk', parentLocationId: 'loc-dk-bent-row',
        description: "Underground tavern in Bent Row. Veronika Yad's place. Party received free steak as apology here. Patrikeyevna hit a gnome tied to a target with a dart.",
        createdAt: new Date('2026-03-16T00:00:00Z'),
      },
      {
        id: 'loc-dk-smis-palace', campaignId: 'campaign-drakkenheim', name: "Smi's Palace",
        aliases: ["Smi's Palace"], type: 'building-dk', parentLocationId: 'loc-dk-bent-row',
        description: "Underground establishment in Bent Row. Base of 'Wounded Hearts' Queen's Men faction. Owner — Kristian Lam, elf waitress Tilda. Party stayed here after session 15.",
        createdAt: new Date('2026-02-26T00:00:00Z'),
      },
      {
        id: 'loc-dk-arena', campaignId: 'campaign-drakkenheim', name: 'Arena',
        aliases: ['Underground Arena'], type: 'dungeon-dk', parentLocationId: 'loc-dk-bent-row',
        description: 'Large underground arena in the sewers beneath Bent Row. Floor in blood and mud, benches for ~40 spectators, fighting ring with wooden barricades, VIP platform. Organizer — Bull (scarred face, one blind eye). Bets taken by halfling Rocky.',
        createdAt: new Date('2026-03-09T00:00:00Z'),
      },
    ],
  });

  console.log('Seeding NPCs...');

  // ══════════════════════════════════════════════════════════════════════════
  //  NPCS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Farchester NPCs ───────────────────────────────────────────────────────
  await prisma.nPC.createMany({
    data: [
      {
        id: 'npc-kronheyv', campaignId: 'campaign-farchester', name: 'Lord-Admiral Edward Kronhev',
        aliases: ['Margrave', 'Lord-Admiral', 'Edward Kronhev'],
        status: 'ALIVE', gender: 'MALE', age: 57, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Tired, gaunt. Naval trophies in residence. Wife and guards hide alcohol from him.',
        personality: 'Authoritarian, cold, hides exhaustion behind arrogance. Despises those who question his authority. Brief and demanding in conversation. Rare moments of sincerity reveal a man crushed by office.',
        description: 'Margrave of the Steppe March. Declared dry law and curfew. Openly despises elves and steppe peoples. Claims the party are the first arrivals since his appointment. Asked to find special alcohol from Yorvert.',
        gmNotes: 'Possibly the cause of the river drying up through Tuts. Knows more than he says.',
        createdAt: new Date('2026-02-24T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'npc-stoungriv', campaignId: 'campaign-farchester', name: 'Torbald Stoungriv',
        aliases: ['Burgmaster', 'Burgmaster Stoungriv'],
        status: 'ALIVE', gender: 'MALE', age: 46, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Lean man of middle age with short dark hair and stern gaze. Colorful outfit with diamond pattern, red beret. Always with scrolls.',
        personality: 'Calculating and duplicitous — smiles to your face while manipulating behind your back. Genuinely loves the city, but that love justifies any means. Never openly shows fear. Likes being underestimated.',
        description: 'Burgmaster of Farchester. Originally a free-spirit. Hired the party at 50gp per name of Gefara Order agents. Issued documents obliging citizens to help the bearer. Treasury short 5000 gold.',
        gmNotes: 'KEY QUESTION: the party ARE Gefara agents. Option A — he does not know. Option B — he knows but keeps them under control. The phrase "everyone fears the burgmaster" (Tuts) — a hint.',
        createdAt: new Date('2026-02-24T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'npc-edit-hargrave', campaignId: 'campaign-farchester', name: 'Edit Hargrave',
        aliases: ['Hargrave'],
        status: 'ALIVE', gender: 'FEMALE', age: 31, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Dark skin, dark hair. Black-red tabard over chainmail, red cloak, sword at waist.',
        description: "Liaison and representative of Kronhev. Invited the party to the Lord-Admiral.",
        createdAt: new Date('2026-02-24T00:00:00Z'),
        updatedAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'npc-eshborn', campaignId: 'campaign-farchester', name: 'Gareth Ridderh Eshborn',
        aliases: ['Gareth Eshborn'],
        status: 'ALIVE', gender: 'MALE', age: 44, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Middle-aged man, graying hair, confident gaze. Blue vest with starry pattern, chainmail, curved sword.',
        description: 'Local resident. Brought the party to the town hall. Bet 5gp on the halfling dying.',
        createdAt: new Date('2026-02-24T00:00:00Z'),
        updatedAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'npc-yorvert', campaignId: 'campaign-farchester', name: 'Yorvert',
        aliases: ['Iorwerth', 'Tavernkeeper'],
        status: 'ALIVE', gender: 'MALE', age: 45, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Man of about forty-five, light chestnut hair to shoulders, neat graying beard. Good-natured smile. Green vest, white shirt, Celtic brooch. Always with a mug.',
        personality: 'Warm and forgiving. Slowly forms opinions about people — but for a long time. Avoids conflict but is no coward. Slightly old-fashioned: believes good beer solves more problems than politics.',
        description: 'Tavernkeeper of Y Kuru Ayr. Centrist. Dislikes elves. Admitted he is not brewing alcohol now — no equipment. Helped the party brew 2 bottles of special alcohol.',
        createdAt: new Date('2026-02-24T00:00:00Z'),
        updatedAt: new Date('2026-03-18T00:00:00Z'),
      },
      {
        id: 'npc-tuts', campaignId: 'campaign-farchester', name: 'Tuts',
        aliases: ['Tuts', 'Tower Mage'],
        status: 'ALIVE', gender: 'MALE', age: 118, species: 'Gnome', speciesId: 'species-gnome-fc',
        appearance: 'Gnome mage. Irritated by his apprentice who cannot master Mage Hand after 6 months.',
        personality: 'Brilliant mind in an eternally impatient shell. Speaks fast and expects the listener to keep up. Hates incompetence but secretly values persistence. Hides that he is lonely.',
        description: "Mage, owner of the tower in Farchester. Tower guarded by a stone terrier with riddles. First floor for very large creatures, second — enormous number of clocks. Has some connection with Stoungriv.",
        gmNotes: 'Possibly the gnome who "did magic with the river" for goblins and made a deal with Gnurk.',
        createdAt: new Date('2026-03-02T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'npc-gvilim', campaignId: 'campaign-farchester', name: 'Gwilym ap Owain',
        aliases: ['Gwilym ap Owain'],
        status: 'ALIVE', gender: 'MALE', age: 20, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Short young lad with wild curly red hair and a wide sincere smile. Light brown eyes. Linen shirt, brown vest. Absent-minded.',
        description: "Apprentice of mage Tuts in the tower. Has not been able to master Mage Hand for 6 months — Tuts is furious. The same lad from session 1 whom Esme helped in the tavern.",
        createdAt: new Date('2026-02-20T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'npc-vaysiriel', campaignId: 'campaign-farchester', name: 'Vaysiriel',
        aliases: ['Waysiryel'],
        status: 'UNKNOWN', gender: 'FEMALE', age: 245, species: 'Elf', speciesId: 'species-elf-fc',
        appearance: 'Elf with long silver-white hair with gray tint. Red/pink eyes with dark lids. Pointed ears, dagger earring. Dark green armor. Mysterious half-smile — looks dangerous.',
        description: 'Mentioned in session 4. Details unknown. Seems dangerous.',
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'npc-elarwen', campaignId: 'campaign-farchester', name: 'Elarwen',
        aliases: ['Elarwen'],
        status: 'ALIVE', gender: 'MALE', age: 183, species: 'Elf', speciesId: 'species-elf-fc',
        description: 'Leader of the elf camp outside the gates of Farchester. The city pollutes the forest — elves are ready to cooperate in exchange for solving the problem.',
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'npc-gnurk', campaignId: 'campaign-farchester', name: 'Gnurk',
        aliases: ['Gnurk'],
        status: 'ALIVE', gender: 'MALE', age: 35, species: 'Goblin', speciesId: 'species-goblin-fc',
        description: 'Shaman and leader of the goblin camp outside the gates. Goblin caves are flooding. Made a deal with a gnome who "did magic with the river" (possibly Tuts). After that goblins started growing mushrooms. In session 5 asked to bring special mold from the city.',
        gmNotes: 'Deal with Tuts — key clue. What exactly did they agree on?',
        createdAt: new Date('2026-03-12T00:00:00Z'),
        updatedAt: new Date('2026-03-18T00:00:00Z'),
      },
      {
        id: 'npc-mirian', campaignId: 'campaign-farchester', name: 'Mirian verch Yorvert',
        aliases: ['Miriam'],
        status: 'UNKNOWN', gender: 'FEMALE', age: 19, species: 'Human', speciesId: 'species-human-fc',
        appearance: 'Young woman with dark chestnut curly hair, green ribbons. Freckles, green eyes. Green corset, white apron.',
        description: "Possible relative of tavernkeeper Yorvert. Not yet met in person.",
        createdAt: new Date('2026-02-24T00:00:00Z'),
        updatedAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'npc-kragven', campaignId: 'campaign-farchester', name: 'Kragven Raudvegr',
        aliases: ['Kragwen Raudvegr'],
        status: 'ALIVE', gender: 'MALE', age: 82, species: 'Dwarf', speciesId: 'species-dwarf-fc',
        description: 'Head of the dwarf caravan. Most important of the dwarf group. One of them had a map. Possibly know how to brew alcohol.',
        createdAt: new Date('2026-03-02T00:00:00Z'),
        updatedAt: new Date('2026-03-02T00:00:00Z'),
      },
    ],
  });

  // ── Drakkenheim NPCs ──────────────────────────────────────────────────────
  await prisma.nPC.createMany({
    data: [
      // Hooded Lanterns
      {
        id: 'npc-drexel', campaignId: 'campaign-drakkenheim', name: 'Elias Drexel',
        aliases: ['Elias Drexel'],
        status: 'ALIVE', gender: 'MALE', age: 47, species: 'Human', speciesId: 'species-human-dk',
        personality: 'Military to the core: disciplined, laconic, mission first. Never says more than needed — every word weighed. Respects those who keep their word. Hides war-weariness behind a stern face.',
        description: 'Commander of the Hooded Lanterns. Ally of the party.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-01-10T00:00:00Z'),
      },
      {
        id: 'npc-ansom-lang', campaignId: 'campaign-drakkenheim', name: 'Ansom Lang',
        aliases: ['Ansom Lang'],
        status: 'ALIVE', gender: 'MALE', age: 28, species: 'Human', speciesId: 'species-human-dk',
        description: 'Lanterns member. Wants to restore the old city, capital and nation. Brother of Petra Lang. In session 5 asked to rescue his sister — completed in session 7.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'npc-petra-lang', campaignId: 'campaign-drakkenheim', name: 'Petra Lang',
        aliases: ['Petra Lang'],
        status: 'ALIVE', gender: 'FEMALE', age: 26, species: 'Human', speciesId: 'species-human-dk',
        description: 'Sister of Ansom Lang. Went missing on patrol, captured by rats. Rescued by the party from the Rat Nest (session 7). Revealed the Amethysts are hiding a secret about Oscar Yoren.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-01-15T00:00:00Z'),
      },
      {
        id: 'npc-raine', campaignId: 'campaign-drakkenheim', name: 'Raine Highlash',
        aliases: ['Raine Highlash'],
        status: 'ALIVE', gender: 'FEMALE', age: 34, species: 'Human', speciesId: 'species-human-dk',
        description: 'Watch captain of the Lanterns at the Emberwood Watchtower. First met in session 1.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      // Queen's Men
      {
        id: 'npc-rosa-carver', campaignId: 'campaign-drakkenheim', name: 'Rosa Carver',
        aliases: ['Rosa Carver'],
        status: 'ALIVE', gender: 'FEMALE', age: 36, species: 'Human', speciesId: 'species-human-dk',
        appearance: 'Red-haired woman warrior in dark armor.',
        personality: 'Businesslike and ruthless — no wasted words. Smiles exactly as much as the deal requires. Respects strength and hates sentiment. Never threatens twice.',
        description: "Boss of 'Rose and Thorns' — Queen's Men subgroup. Base at Old Imperial Pub and Bent Row.",
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-12-15T00:00:00Z'),
      },
      {
        id: 'npc-kristian-lam', campaignId: 'campaign-drakkenheim', name: 'Kristian Lam',
        aliases: ['Kristian Lam'],
        status: 'ALIVE', gender: 'MALE', age: 42, species: 'Human', speciesId: 'species-human-dk',
        description: "Boss of 'Wounded Hearts' — Queen's Men subgroup. Base at Smi's Palace and Bent Row.",
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'npc-veronika-yad', campaignId: 'campaign-drakkenheim', name: 'Veronika Yad',
        aliases: ['Veronika Yad', 'Veronica Poison'],
        status: 'ALIVE', gender: 'FEMALE', age: 31, species: 'Human', speciesId: 'species-human-dk',
        appearance: 'Grim woman with dark hair.',
        description: "Boss of 'Sewer Cobras' — Queen's Men subgroup. Base in Bent Row. Met in session 17 at the Sweaty Bugbear.",
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2026-03-16T00:00:00Z'),
      },
      {
        id: 'npc-serpenta', campaignId: 'campaign-drakkenheim', name: 'Serpenta',
        aliases: ['Serpenta'],
        status: 'ALIVE', gender: 'FEMALE', age: 23, species: 'Human', speciesId: 'species-human-dk',
        appearance: 'Young woman in a black cloak with hood.',
        description: "Sewer Cobras member. Vermira's acquaintance.",
        createdAt: new Date('2025-11-01T00:00:00Z'),
        updatedAt: new Date('2025-11-01T00:00:00Z'),
      },
      {
        id: 'npc-bufotenia', campaignId: 'campaign-drakkenheim', name: 'Bufotenia',
        aliases: ['Bufotenia'],
        status: 'ALIVE', gender: 'FEMALE', species: 'Unknown',
        description: 'Sewer Cobras. In session 11 in Bent Row — eyes glow red, sees invisible.',
        createdAt: new Date('2025-11-01T00:00:00Z'),
        updatedAt: new Date('2025-11-01T00:00:00Z'),
      },
      {
        id: 'npc-muskarina', campaignId: 'campaign-drakkenheim', name: 'Muskarina',
        aliases: ['Muskarina'],
        status: 'ALIVE', gender: 'FEMALE', species: 'Unknown',
        description: 'Sewer Cobras. Details unknown.',
        createdAt: new Date('2025-11-01T00:00:00Z'),
        updatedAt: new Date('2025-11-01T00:00:00Z'),
      },
      {
        id: 'npc-izrael', campaignId: 'campaign-drakkenheim', name: 'Izrael',
        aliases: ['Izrael', 'Israel'],
        status: 'ALIVE', gender: 'MALE', age: 37, species: 'Human', speciesId: 'species-human-dk',
        description: 'Bartender at Old Imperial Pub. Rose and Thorns.',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'npc-tilda', campaignId: 'campaign-drakkenheim', name: 'Tilda',
        aliases: ['Tilda'],
        status: 'ALIVE', gender: 'FEMALE', age: 178, species: 'Elf', speciesId: 'species-elf-dk',
        description: "Elf waitress at Smi's Palace. Wounded Hearts.",
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'npc-bloodhound', campaignId: 'campaign-drakkenheim', name: 'Bloodhound',
        aliases: ['Bloodhound'],
        status: 'ALIVE', gender: 'MALE', age: 26, species: 'Tiefling', speciesId: 'species-tiefling-dk',
        appearance: 'Horned, darkish character.',
        description: "Arena fighter in Bent Row. Based at Sweaty Bugbear. Group unknown.",
        createdAt: new Date('2025-11-01T00:00:00Z'),
        updatedAt: new Date('2025-11-01T00:00:00Z'),
      },
      {
        id: 'npc-dorian', campaignId: 'campaign-drakkenheim', name: 'Dorian Derzky',
        aliases: ['Dorian the Bold'],
        status: 'ALIVE', gender: 'MALE', age: 64, species: 'Human', speciesId: 'species-human-dk',
        appearance: 'Elderly man with gray beard, seen a lot.',
        description: 'Arena fighter in Bent Row. Wounded Hearts.',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'npc-tony', campaignId: 'campaign-drakkenheim', name: 'Tony',
        aliases: ['Tony'],
        status: 'ALIVE', gender: 'MALE', age: 36, species: 'Human', speciesId: 'species-human-dk',
        appearance: 'Massive, heavy, scary-looking.',
        description: '"Ever-sleeping guard of Tiga" — guards someone named Tiga. Bent Row.',
        createdAt: new Date('2025-11-01T00:00:00Z'),
        updatedAt: new Date('2025-11-01T00:00:00Z'),
      },
      // Amethyst Academy
      {
        id: 'npc-eldric', campaignId: 'campaign-drakkenheim', name: 'Eldric Runeweaver',
        aliases: ['Eldric Runeweaver'],
        status: 'ALIVE', gender: 'MALE', age: 53, species: 'Human', speciesId: 'species-human-dk',
        description: 'Leads the local conclave of the Amethyst Academy. During the meteor fall the chief mage with the staff was in the tower. Hides information about Oscar Yoren.',
        gmNotes: 'Key figure in the Oscar mystery. What does he know?',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-river', campaignId: 'campaign-drakkenheim', name: 'River',
        aliases: ['River'],
        status: 'ALIVE', gender: 'FEMALE', age: 28, species: 'Tiefling', speciesId: 'species-tiefling-dk',
        personality: 'Sharp, closed off, condescending to those she likes — and that is almost a compliment. Speaks with languid ease but listens carefully. Keeps distance and gets irritated when it is breached.',
        description: 'Tiefling warlock. Runs the Amethyst outpost in Emberwood. Spends evenings in the Red Lion private library. Pragmatic as hell. Reacts strangely to the name Oscar Yoren. Shared info about Eckerman Mill. Sent telepathic messages.',
        gmNotes: 'Why the dislike of Yoren? Does she know something or is she involved?',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-03-01T00:00:00Z'),
      },
      {
        id: 'npc-sebastian', campaignId: 'campaign-drakkenheim', name: 'Sebastian',
        aliases: ['Sebastian'],
        status: 'ALIVE', gender: 'MALE', age: 24, species: 'Human', speciesId: 'species-human-dk',
        description: "Oscar Yoren's student. Left the Amethyst Academy. Stole tomes on summoning, necromancy, and possibly transmutation. His funding was cut. Group: Marco, Gemma, Tarrin, Bolter, Copperpot.",
        gmNotes: 'Connected to infected potions? Where did he go after the Academy?',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-12-01T00:00:00Z'),
      },
      // Unknown / Mystery
      {
        id: 'npc-oscar-yoren', campaignId: 'campaign-drakkenheim', name: 'Oscar Yoren',
        aliases: ['Oscar Yoren'],
        status: 'UNKNOWN', gender: 'MALE', age: 52, species: 'Human', speciesId: 'species-human-dk',
        personality: 'Paranoid genius. Works in isolation by choice. Trusts no one long enough. Can be charming when he needs something. His disappearance is no accident.',
        description: 'Former(?) member of the Amethyst Academy. River knows where he is — but stays silent. Eldric Runeweaver hides information. Sebastian — his student. Johann Ghostweaver had dealings with him. Connected to contaminated purification potions (Lanterns quest).',
        gmNotes: 'CENTRAL CAMPAIGN MYSTERY. What are the Amethysts hiding? Is he even alive?',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      },
      {
        id: 'npc-ghostweaver', campaignId: 'campaign-drakkenheim', name: 'Johann Ghostweaver',
        aliases: ['Johann Ghostweaver'],
        status: 'UNKNOWN', gender: 'MALE', age: 63, species: 'Human', speciesId: 'species-human-dk',
        description: 'Taught Zoya the delirium cure. Had dealings with Oscar Yoren. Party has not yet met him — needs to be found.',
        gmNotes: 'Key to understanding the Zoya -> Yoren connection. Where is he now?',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2026-02-15T00:00:00Z'),
      },
      // Followers of the Falling Fire
      {
        id: 'npc-katya-brown', campaignId: 'campaign-drakkenheim', name: 'Katya Brown',
        aliases: ['Katya Brown', 'Tanya Brown'],
        status: 'ALIVE', gender: 'FEMALE', age: 37, species: 'Human', speciesId: 'species-human-dk',
        description: "Vermira's former classmate. Was in the Sacred Flame, defected to cultists after the Mage Massacre 15 years ago. Cultist at Champion's Gate. In session 13 — took Bag of Holding with fanatics.",
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'npc-lucretia', campaignId: 'campaign-drakkenheim', name: 'Lucretia Mathias',
        aliases: ['Lucretia Mathias'],
        status: 'ALIVE', gender: 'FEMALE', age: 44, species: 'Human', speciesId: 'species-human-dk',
        description: "Possibly runs the Falling Fire cultists at Champion's Gate. Met in session 10.",
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      // Silver Order
      {
        id: 'npc-bryce-landry', campaignId: 'campaign-drakkenheim', name: 'Sir Bryce Landry',
        aliases: ['Bryce Landry'],
        status: 'ALIVE', gender: 'MALE', age: 39, species: 'Human', speciesId: 'species-human-dk',
        description: 'Knight of the Silver Order. Zakaris was looking for him — found. Korvin hit him with Magic Missile in both kneecaps (session 14).',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2026-02-01T00:00:00Z'),
      },
      // Independent NPCs
      {
        id: 'npc-tobias-crowe', campaignId: 'campaign-drakkenheim', name: 'Tobias Crowe',
        aliases: ['Tobias Crowe'],
        status: 'ALIVE', gender: 'MALE', age: 44, species: 'Human', speciesId: 'species-human-dk',
        description: 'Owns Crowe and Sons smithy in Emberwood. Probably father of Emma Crowe. Expensive but custom-made.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-emma-crowe', campaignId: 'campaign-drakkenheim', name: 'Emma Crowe',
        aliases: ['Emma Crowe'],
        status: 'ALIVE', gender: 'FEMALE', age: 11, species: 'Human', speciesId: 'species-human-dk',
        appearance: 'Red-haired little girl. Super energetic.',
        description: "Daughter of smith Tobias. Gives tours of Emberwood for 1gp. Knows rumors.",
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-karin-alsberg', campaignId: 'campaign-drakkenheim', name: 'Karin Alsberg',
        aliases: ['Karin Alsberg'],
        status: 'ALIVE', gender: 'FEMALE', age: 42, species: 'Human', speciesId: 'species-human-dk',
        personality: 'Practical and hospitable — without extra warmth. Always busy, rarely sits. Quickly spots problems and solves them before they grow. Protects guests but does not tolerate troublemakers.',
        description: 'Owner of Bark and Buzzard. Has a husband named Holger.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-zoya', campaignId: 'campaign-drakkenheim', name: 'Zoya',
        aliases: ['Zoya'],
        status: 'MISSING', gender: 'FEMALE', age: 72, species: 'Human', speciesId: 'species-human-dk',
        personality: 'Speaks in half-truths and hints — not out of malice, but because that is how she sees the world. Quiet but with character. Her silence means more than others\' words. Loves Patrikeyevna like family.',
        description: "Hermit old woman, worships the Old Gods. Not liked in Emberwood. Sells amber beads. Friend of Patrikeyevna. Knows the delirium cure (taught by Johann Ghostweaver). In session 17 turned out to be a doppelganger of the Mind Reaper — real Zoya's location unknown.",
        gmNotes: 'Where is the real Zoya? Why does the Mind Reaper want her? Connection to Yoren through Ghostweaver.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-03-16T00:00:00Z'),
      },
      {
        id: 'npc-aldor', campaignId: 'campaign-drakkenheim', name: 'Aldor',
        aliases: ['Aldor', 'Aldor the Giant', 'Djinn'],
        status: 'ALIVE', gender: 'MALE', age: 1200, species: 'Djinn',
        personality: 'Absolutely transactional — no warmth, no malice. Treats mortals as counterparties. Patient exactly as long as it is profitable. Deals are his language, threats are his punctuation.',
        description: "Djinn. Sells magic items at the night market. Korvin's 500gp debt for the destroyed Bag of Holding — repaid in session 17 with a cursed fire sword. Located in the astral plane, found a scepter — offered a trade. According to Queen's Men — imprisoned in this place.",
        gmNotes: 'Scepter in the astral — what is it? Is the deal worthwhile?',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-03-16T00:00:00Z'),
      },
      {
        id: 'npc-orson', campaignId: 'campaign-drakkenheim', name: 'Orson Fairweather',
        aliases: ['Orson Fairweather'],
        status: 'ALIVE', gender: 'MALE', age: 40, species: 'Human', speciesId: 'species-human-dk',
        description: 'Delirium trader at the night market. Small container 4gp, medium 10gp, large 20gp. Party sold delirium to him for 27gp (session 5).',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'npc-armin', campaignId: 'campaign-drakkenheim', name: 'Armin Gainsbury',
        aliases: ['Armin Gainsbury'],
        status: 'ALIVE', gender: 'MALE', age: 38, species: 'Human', speciesId: 'species-human-dk',
        description: 'Sells adventuring gear at Emberwood market.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-eren-marlow', campaignId: 'campaign-drakkenheim', name: 'Eren Marlow',
        aliases: ['Eren Marlow'],
        status: 'ALIVE', gender: 'MALE', age: 33, species: 'Human', speciesId: 'species-human-dk',
        description: 'Brought the party to Emberwood in session 1. Sells basic supplies at market. Works at night. Can introduce Armin Gainsbury.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-madam-rochelle', campaignId: 'campaign-drakkenheim', name: 'Madam Rochelle',
        aliases: ['Madam Rochelle'],
        status: 'ALIVE', gender: 'FEMALE', age: 52, species: 'Human', speciesId: 'species-human-dk',
        personality: 'Refined and observant. Sees everything, says nothing extra. Holds neutrality as a shield. Knows how to make you feel like her only important guest.',
        description: 'Runs the Gilded Lily. Open mic evenings.',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-antoine-megara', campaignId: 'campaign-drakkenheim', name: 'Antoine Megara',
        aliases: ['Antoine Megara'],
        status: 'ALIVE', gender: 'MALE', age: 46, species: 'Human', speciesId: 'species-human-dk',
        description: 'Wealthy nobleman. Follower of Sacred Flame (not faction member). Arrived in Drakkenheim on a mission. Party took 30gp from him (session 12). Team "Most Beautiful House Megara".',
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      },
      {
        id: 'npc-endra-jansen', campaignId: 'campaign-drakkenheim', name: 'Endra Jansen',
        aliases: ['Endra Jansen'],
        status: 'ALIVE', gender: 'FEMALE', age: 27, species: 'Human', speciesId: 'species-human-dk',
        description: "From Rikard Vos's and Ludwig von Graff's group. Survived after Rikard's transformation into a monster.",
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-rikard-vos', campaignId: 'campaign-drakkenheim', name: 'Rikard Vos',
        aliases: ['Rikard Vos'],
        status: 'DEAD', gender: 'MALE', age: 31, species: 'Human', speciesId: 'species-human-dk',
        description: "First monster the party encountered. Touched delirium on the road and began transforming — by night fully monstrous. From Ludwig von Graff's and Endra Jansen's group.",
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-ludwig', campaignId: 'campaign-drakkenheim', name: 'Ludwig von Graff',
        aliases: ['Ludwig von Graff'],
        status: 'DEAD', gender: 'MALE', age: 34, species: 'Human', speciesId: 'species-human-dk',
        description: "From Rikard Vos's and Endra Jansen's group. Died on the road to Emberwood.",
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-kosta-stavros', campaignId: 'campaign-drakkenheim', name: 'Kosta Stavros',
        aliases: ['Kosta Stavros'],
        status: 'DEAD', gender: 'MALE', age: 51, species: 'Human', speciesId: 'species-human-dk',
        description: 'Former owner of Red Lion Hotel. Killed by a doppelganger — confirmed. In session 11 discovered as corpse.',
        gmNotes: 'Doppelganger took his place — who else might be replaced?',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-11-01T00:00:00Z'),
      },
      {
        id: 'npc-bogdan', campaignId: 'campaign-drakkenheim', name: 'Bogdan',
        aliases: ['Bogdan'],
        status: 'MISSING', gender: 'MALE', age: 40, species: 'Human', speciesId: 'species-human-dk',
        description: "Leader of the gang that attacked the party in session 1. Fled during the encounter with the monster on the road — took someone's dagger. Hiding somewhere.",
        gmNotes: "Whose dagger? What is he planning?",
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'npc-mind-reaper', campaignId: 'campaign-drakkenheim', name: 'Mind Reaper',
        aliases: ['Mind Reaper', 'Doppelganger', 'Fake Zoya'],
        status: 'MISSING', gender: 'NONBINARY', species: 'Doppelganger',
        description: 'Doppelganger. Impersonated Zoya in Bent Row. Scared off by minor illusion — fled (session 17). Why pretend to be Zoya? Connected to factions?',
        gmNotes: 'Who controls it? Goal — steal the delirium cure?',
        createdAt: new Date('2026-03-16T00:00:00Z'),
        updatedAt: new Date('2026-03-16T00:00:00Z'),
      },
      {
        id: 'npc-chertyaka', campaignId: 'campaign-drakkenheim', name: 'Chertyaka',
        aliases: ['Chertyaka'],
        status: 'MISSING', gender: 'MALE', age: 7, species: 'Horse',
        description: "Sai's horse. With the party since session 1. Took a while to tame but warmed up after the chapel. Almost certainly infected with Drakkenheim haze — spent long time in/near the city. In session 17 released north of Bent Row before escape. Location unknown.",
        gmNotes: 'Probably infected with delirium. What will happen? Mutation?',
        createdAt: new Date('2025-09-01T00:00:00Z'),
        updatedAt: new Date('2026-03-16T00:00:00Z'),
      },
    ],
  });

  console.log('Seeding groups...');

  // ══════════════════════════════════════════════════════════════════════════
  //  GROUPS
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.group.createMany({
    data: [
      // ── Farchester ──────────────────────────────────────────────
      {
        id: 'faction-fc-red', campaignId: 'campaign-farchester', name: 'Red Faction (Imperial)',
        type: 'faction-fc', aliases: ['Red Faction', 'Imperial Guard'],
        description: 'Represent imperial order. Lord-Admiral Kronhev appointed 2 years ago — the wall was built under his rule. Red guards answer to Kronhev.',
        goals: 'Keep Farchester under imperial control. Suppress all opposition.',
        symbols: 'Red guard uniform, imperial eagle',
        createdAt: new Date('2026-02-24T00:00:00Z'), updatedAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'faction-fc-blue', campaignId: 'campaign-farchester', name: 'Blue Faction (City)',
        type: 'faction-fc', aliases: ['Blue Faction', 'City Guard'],
        description: 'Represent the interests of native Farchester citizens. Burgmaster Stoungriv is originally a free-spirit. Enthusiastic about elves, unlike the Reds.',
        goals: 'Defend the city from Gefara Order spies. Deal with protesters. Normalize the food situation.',
        symbols: 'Blue guard uniform',
        createdAt: new Date('2026-02-24T00:00:00Z'), updatedAt: new Date('2026-02-24T00:00:00Z'),
      },
      {
        id: 'group-fc-party', campaignId: 'campaign-farchester', name: 'The Farchester Party',
        type: 'guild-fc', aliases: ['The Party'],
        description: 'The adventuring party operating in Farchester: Alvin, Godrik, Evelina, Esme, and Yanko. Hired by Burgmaster Stoungriv to find Gefara Order agents.',
        goals: 'Investigate the city, find spies, and survive.',
        partyRelation: 'self',
        createdAt: new Date('2026-02-20T00:00:00Z'), updatedAt: new Date('2026-02-20T00:00:00Z'),
      },
      {
        id: 'group-fc-goblin-protesters', campaignId: 'campaign-farchester', name: 'Goblin Protesters',
        type: 'faction-fc', aliases: ['Goblin Camp'],
        description: 'Goblins camped outside the eastern gate of Farchester. Led by shaman Gnurk. Their caves are flooding — they made a deal with a gnome mage (possibly Tuts) who did magic with the river. They grow mushrooms now.',
        goals: 'Obtain special mold from the city. Resolve the flooding of their caves.',
        createdAt: new Date('2026-03-12T00:00:00Z'), updatedAt: new Date('2026-03-12T00:00:00Z'),
      },
      {
        id: 'group-fc-elf-reps', campaignId: 'campaign-farchester', name: 'Elf Representatives',
        type: 'faction-fc', aliases: ['Elf Camp', 'Elf Delegation'],
        description: 'Elves camped outside the western gate of Farchester. Led by Elarwen. The city is polluting the forest — elves are ready to cooperate in exchange for solving the pollution problem.',
        goals: 'Stop the city from polluting the forest.',
        createdAt: new Date('2026-03-12T00:00:00Z'), updatedAt: new Date('2026-03-12T00:00:00Z'),
      },

      // ── Drakkenheim ─────────────────────────────────────────────
      {
        id: 'faction-dk-lanterns', campaignId: 'campaign-drakkenheim', name: 'The Hooded Lanterns',
        type: 'military-dk', aliases: ['Lanterns'],
        description: 'Guard Emberwood and strive to revive the old power — restore the former capital. Members wear characteristic lanterns.',
        goals: 'Restore Drakkenheim. Protect Emberwood from delirium threats.',
        symbols: 'Lantern, gray cloak',
        partyRelation: 'Allied — the party has worked with Drexel and rescued Petra Lang.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'faction-dk-queens', campaignId: 'campaign-drakkenheim', name: "Queen's Men",
        type: 'criminal-dk', aliases: ["Queen's Men"],
        description: "Bandits and thieves, divided into several subgroups: Sewer Cobras (Bent Row), Rose and Thorns (Old Imperial Pub), Wounded Hearts (Smi's Palace). Symbol — red diamond as tattoo.",
        goals: 'Control the criminal underworld of Emberwood and surroundings.',
        symbols: 'Red diamond (diamond suit), tattoo',
        partyRelation: 'Complex — the party has both worked with and been imprisoned by them.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'faction-dk-amethyst', campaignId: 'campaign-drakkenheim', name: 'The Amethyst Academy',
        type: 'academy-dk', aliases: ['Amethyst Academy', 'Amethysts'],
        description: 'Powerful magical organization interested in delirium. Hide information about Oscar Yoren.',
        goals: 'Monopoly on the study and use of delirium.',
        symbols: 'Amethyst crystal',
        partyRelation: 'Unknown — River cooperates but keeps secrets.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'faction-dk-flame', campaignId: 'campaign-drakkenheim', name: 'The Followers of the Falling Fire',
        type: 'religion-dk', aliases: ['Falling Fire', 'Followers'],
        description: "Religious cult worshipping the delirium meteorite as a sacred sign. Based at Champion's Gate.",
        goals: 'Spread the delirium cult. Control the ruins of Drakkenheim.',
        symbols: 'Falling star, orange flame',
        partyRelation: 'Hostile — they stole the Bag of Holding.',
        createdAt: new Date('2025-10-01T00:00:00Z'), updatedAt: new Date('2025-10-01T00:00:00Z'),
      },
      {
        id: 'faction-dk-silver', campaignId: 'campaign-drakkenheim', name: 'Knights of the Silver Order',
        type: 'military-dk', aliases: ['Silver Order', 'Silver Knights'],
        description: 'Knightly order seeking to destroy delirium contamination and purify Drakkenheim.',
        goals: 'Complete destruction of delirium. Restoration of order.',
        symbols: 'Silver shield, white cloak',
        partyRelation: 'Neutral — Korvin shot Bryce Landry in the kneecaps.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'group-dk-party', campaignId: 'campaign-drakkenheim', name: 'The Drakkenheim Party',
        type: 'guild-dk', aliases: ['The Party', 'Adventurers'],
        description: 'The adventuring party: Korvin (Human Wizard), Vermira (Dwarf Paladin), Sai (Elf), Patrikeyevna (Monk). They navigate the dangerous ruins and underground districts.',
        goals: 'Survive Drakkenheim, find Oscar Yoren, uncover the truth about the delirium.',
        partyRelation: 'self',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'group-dk-lang-family', campaignId: 'campaign-drakkenheim', name: 'Lang Family',
        type: 'family-dk', aliases: ['Langs'],
        description: 'Ansom Lang and Petra Lang are siblings. Both members of the Hooded Lanterns. Petra was captured by rats and rescued by the party from Rat Nest in session 7.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'group-dk-crowe-family', campaignId: 'campaign-drakkenheim', name: 'Crowe Family',
        type: 'family-dk', aliases: ['Crowes'],
        description: 'Tobias Crowe and his daughter Emma. Run Crowe and Sons smithy in Emberwood.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
      {
        id: 'group-dk-road-travelers', campaignId: 'campaign-drakkenheim', name: 'Road Travelers',
        type: 'guild-dk', aliases: ['Rikard Group'],
        description: 'Rikard Vos, Ludwig von Graff, and Endra Jansen — a group of travelers on the road to Emberwood. Rikard touched delirium and transformed. Ludwig died. Endra survived.',
        createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z'),
      },
    ],
  });

  console.log('Seeding player characters...');

  // ══════════════════════════════════════════════════════════════════════════
  //  PLAYER CHARACTERS
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.playerCharacter.createMany({
    data: [
      // Farchester
      { id: 'char-alvin', campaignId: 'campaign-farchester', userId: 'user-ivan', name: 'Alvin Hart', gender: 'MALE', age: 24, species: 'Human', speciesId: 'species-human-fc', gmNotes: '', createdAt: new Date('2026-02-01T00:00:00Z'), updatedAt: new Date('2026-02-01T00:00:00Z') },
      { id: 'char-godrik', campaignId: 'campaign-farchester', userId: 'user-seva', name: 'Godrik', gender: 'MALE', age: 31, species: 'Human', speciesId: 'species-human-fc', class: 'Paladin', gmNotes: '', createdAt: new Date('2026-02-01T00:00:00Z'), updatedAt: new Date('2026-02-01T00:00:00Z') },
      { id: 'char-evelina', campaignId: 'campaign-farchester', userId: 'user-elya', name: 'Evelina', gender: 'FEMALE', age: 28, species: 'Halfling', speciesId: 'species-halfling-fc', gmNotes: '', createdAt: new Date('2026-02-01T00:00:00Z'), updatedAt: new Date('2026-02-01T00:00:00Z') },
      { id: 'char-esme', campaignId: 'campaign-farchester', userId: 'user-zhenya', name: 'Esme', gender: 'FEMALE', age: 147, species: 'Elf', speciesId: 'species-elf-fc', class: 'Alchemist', gmNotes: '', createdAt: new Date('2026-02-01T00:00:00Z'), updatedAt: new Date('2026-02-01T00:00:00Z') },
      { id: 'char-yanko', campaignId: 'campaign-farchester', userId: 'user-sergey', name: 'Yanko', gender: 'MALE', age: 27, class: 'Ranger', gmNotes: '', createdAt: new Date('2026-02-01T00:00:00Z'), updatedAt: new Date('2026-02-01T00:00:00Z') },
      // Drakkenheim
      { id: 'char-korvin', campaignId: 'campaign-drakkenheim', userId: 'user-ivan', name: 'Korvin', gender: 'MALE', age: 22, species: 'Human', speciesId: 'species-human-dk', class: 'Wizard', gmNotes: '', createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z') },
      { id: 'char-vermira', campaignId: 'campaign-drakkenheim', userId: 'user-adel', name: 'Vermira', gender: 'FEMALE', age: 68, species: 'Dwarf', speciesId: 'species-dwarf-dk', class: 'Paladin', gmNotes: '', createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z') },
      { id: 'char-sai', campaignId: 'campaign-drakkenheim', userId: 'user-natasha', name: 'Sai', gender: 'NONBINARY', age: 194, species: 'Elf', speciesId: 'species-elf-dk', gmNotes: '', createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z') },
      { id: 'char-patrikeyevna', campaignId: 'campaign-drakkenheim', userId: 'user-jess', name: 'Patrikeyevna', gender: 'FEMALE', age: 35, class: 'Monk', gmNotes: '', createdAt: new Date('2025-09-01T00:00:00Z'), updatedAt: new Date('2025-09-01T00:00:00Z') },
    ],
  });

  console.log('Seeding sessions...');

  // ══════════════════════════════════════════════════════════════════════════
  //  SESSIONS
  // ══════════════════════════════════════════════════════════════════════════

  // Create sessions first (without links)
  await prisma.session.createMany({
    data: [
      // Farchester
      { id: 'ses-fc-1', campaignId: 'campaign-farchester', number: 1, title: 'Session 1 — 20.02.2026', datetime: '2026-02-20T18:00:00Z', brief: 'Road from Brinwick, arrival in Farchester', summary: 'The party travelled from Brinwick and arrived at the city of Farchester.', createdAt: new Date('2026-02-20T00:00:00Z') },
      { id: 'ses-fc-2', campaignId: 'campaign-farchester', number: 2, title: 'Session 2 — 24.02.2026', datetime: '2026-02-24T18:00:00Z', brief: 'Town Hall, Lord-Admiral Kronhev', summary: 'Getting to know the city, meeting at Town Hall, introduction to Lord-Admiral Kronhev.', createdAt: new Date('2026-02-24T00:00:00Z') },
      { id: 'ses-fc-3', campaignId: 'campaign-farchester', number: 3, title: 'Session 3 — 02.03.2026', datetime: '2026-03-02T18:00:00Z', brief: 'Mage Tower, negotiations', summary: 'The party explored the Mage Tower and engaged in delicate negotiations.', createdAt: new Date('2026-03-02T00:00:00Z') },
      { id: 'ses-fc-4', campaignId: 'campaign-farchester', number: 4, title: 'Session 4 — 12.03.2026', datetime: '2026-03-12T18:00:00Z', brief: 'Meeting with Tuts', summary: "The party met Tuts and learned more about the city's political situation.", createdAt: new Date('2026-03-12T00:00:00Z') },
      { id: 'ses-fc-5', campaignId: 'campaign-farchester', number: 5, title: 'Session 5 — 18.03.2026', datetime: '2026-03-18T18:00:00Z', brief: "Gnurk's mold request, brewing with Yorvert, Alvin falls down stairs", summary: 'The party continued talks with the protesters. Gnurk asked for a special mold from the city. Yorvert helped brew the special alcohol — only 1 bottle survived after Alvin drunkenly smashed one falling down stairs.', createdAt: new Date('2026-03-18T00:00:00Z') },
      // Drakkenheim
      { id: 'ses-dk-0', campaignId: 'campaign-drakkenheim', number: 0, title: 'Session 00 — Intro', datetime: '2025-08-13T18:00:00Z', brief: 'Introductory session — world and characters', summary: 'Introductory session for the Drakkenheim setting. Party assembled: Korvin (Human Wizard), Sai (Elf), Vermira (Dwarf cleric of Sacred Flame), Patrikeyevna (Elderly Monk). No major events recorded.', createdAt: new Date('2025-08-13T00:00:00Z') },
      { id: 'ses-dk-1', campaignId: 'campaign-drakkenheim', number: 1, title: 'Session 01 — Road to Emberwood', datetime: '2025-09-02T18:00:00Z', brief: 'Road to Emberwood, Rikard turns into a monster, Bogdan flees', summary: "Met Eren Marlow — a caravan driver who brought the party to Emberwood. A masked woman with a dagger gave a copper coin. On the road: a corpse with a coin near the Dran river, surrounded by two humans and 'something made of meat and bone'. Rikard Vos touched delirium and began transforming. By night he was fully monstrous. Bogdan fled with the dagger. Party arrived in Emberwood.", createdAt: new Date('2025-09-02T00:00:00Z') },
      { id: 'ses-dk-2', campaignId: 'campaign-drakkenheim', number: 2, title: 'Session 02 — Emberwood', datetime: '2025-09-09T18:00:00Z', brief: 'Emberwood explored, Skull and Sword, Lanterns, River at Red Lion', summary: "Explored Emberwood Village. Spotted a large carriage pulled by two steel bulls radiating magic. Skull and Sword Taphouse confirmed as Queen's Men territory. Night market: Eren Marlow, Aldor (magic items), and Orson Fairweather (delirium trader). River — a tiefling warlock — spends evenings in the Red Lion Hotel library. The Amethyst Academy's conclave is led by Eldric Runeweaver.", createdAt: new Date('2025-09-09T00:00:00Z') },
      { id: 'ses-dk-3', campaignId: 'campaign-drakkenheim', number: 3, title: 'Session 03 — First Raid', datetime: '2025-09-23T18:00:00Z', brief: 'First raid into Drakkenheim, Tainted creatures, Old Rattlecan, Nix summoned', summary: "First raid into Drakkenheim, entering from the south-east. Encountered Tainted Scum. Rats fell asleep easily. Locals climbed Old Rattlecan. Korvin summoned owl familiar Nix for the first time. Patrikeyevna revealed herself as a Monk.", createdAt: new Date('2025-09-23T00:00:00Z') },
      { id: 'ses-dk-4', campaignId: 'campaign-drakkenheim', number: 4, title: 'Session 04 — Gargoyles and Delirium', datetime: '2025-10-15T18:00:00Z', brief: "Gargoyles, 60gp loot, Copperpot's hidden note found", summary: "Fought gargoyles. Found a body bearing the Amethyst Academy sigil. Encountered Queen's Men marked with red diamonds. Found a secret message signed 'Coxworth B. Copperpot'. Loot: 60gp in old coins, 3 pieces of delirium.", createdAt: new Date('2025-10-15T00:00:00Z') },
      { id: 'ses-dk-5', campaignId: 'campaign-drakkenheim', number: 5, title: 'Session 05 — Zoya, Shops, Level 3', datetime: '2025-11-07T18:00:00Z', brief: "Met Zoya, Orson's shop, River's tip about Eckerman Mill, reached level 3", summary: "Found Zoya's house — an old woman selling amber beads who worships the Old Gods. Visited Orson Fairweather's shop. River shared a new point of interest: Eckerman Mill. Quest received from Ansom to rescue Petra Lang. Sold delirium for 27gp. Reached Level 3.", createdAt: new Date('2025-11-07T00:00:00Z') },
      { id: 'ses-dk-6', campaignId: 'campaign-drakkenheim', number: 6, title: 'Session 06 — Gilded Lily', datetime: '2025-11-18T18:00:00Z', brief: 'Gilded Lily, rat fight, Korvin warms to Vermira', summary: "Re-summoned familiar Nix. Visited the Gilded Lily — owned by Madam Rochelle. Fought rats in the ruins. Korvin began treating Vermira better.", createdAt: new Date('2025-11-18T00:00:00Z') },
      { id: 'ses-dk-7', campaignId: 'campaign-drakkenheim', number: 7, title: 'Session 07 — Petra Rescued', datetime: '2025-11-24T18:00:00Z', brief: 'Petra rescued from the Rat Nest, contamination cured', summary: "Rescued Petra Lang from the Rat Nest. A white rat with huge delirium chunks found inside. Petra offered to ask the Amethyst Academy about Oscar Yoren's location. Cured contamination.", createdAt: new Date('2025-11-24T00:00:00Z') },
      { id: 'ses-dk-8', campaignId: 'campaign-drakkenheim', number: 8, title: 'Session 08 — Skull and Sword', datetime: '2025-12-01T18:00:00Z', brief: 'Skull and Sword explored, altar found, Gorota the manticore spotted', summary: "Explored the Skull and Sword Taphouse. Spotted Hooded Lanterns member Anya Kruger. Gorota the manticore seen nearby. Found an altar with 3 vials, incense, and a silver pendant.", createdAt: new Date('2025-12-01T00:00:00Z') },
      { id: 'ses-dk-9', campaignId: 'campaign-drakkenheim', number: 9, title: 'Session 09 — Elementals and Golem', datetime: '2025-12-10T18:00:00Z', brief: 'Elementals, Golem, Copperpot note still undeciphered', summary: "Played hide-and-seek with elementals. Identified the Golem in Emberwood. Copperpot's note remains undeciphered. Loot: 2 citrines, 1 scorched sword, 2 flame pendants.", createdAt: new Date('2025-12-10T00:00:00Z') },
      { id: 'ses-dk-10', campaignId: 'campaign-drakkenheim', number: 10, title: "Session 10 — Champion's Gate", datetime: '2026-01-08T18:00:00Z', brief: "Champion's Gate, cultists, Korvin's backstory revealed", summary: "Met cultists — Tanya Brown, a former classmate of Vermira. Revelation: Patrikeyevna has no crystal inside her. Korvin is the only surviving child from the Sacred Flame Massacre. Reached Champion's Gate — Lucretia Mathias is there.", createdAt: new Date('2026-01-08T00:00:00Z') },
      { id: 'ses-dk-11', campaignId: 'campaign-drakkenheim', number: 11, title: 'Session 11 — Poisons and Lanterns Quest', datetime: '2026-01-15T18:00:00Z', brief: "Poisoners Muskorina & Bufotenia, Lanterns quest, Red Lion, Bent Row discovered", summary: "Encountered poisoners Muskorina and Bufotenia. The Hooded Lanterns want to meet. Rented a room at the Red Lion Hotel. Discovered Bent Row. River reading 'Antidotes and Poisons'. Kosta Stavros found dead. Lanterns quest: contaminated purification potions. OSCAR YOREN is connected.", createdAt: new Date('2026-01-15T00:00:00Z') },
      { id: 'ses-dk-12', campaignId: 'campaign-drakkenheim', number: 12, title: 'Session 12 — River and Sebastian', datetime: '2026-01-22T18:00:00Z', brief: "River's debt, Sebastian's past, Knight-Lieutenant Wyatt", summary: "River sent a telepathic message: return the bag to Giant Aldor within 24 hours. Met Knight-Lieutenant Cassandra Wyatt on a griffon. Learned Sebastian left the Academy — he was Oscar's student, stole tomes on summoning and necromancy. Patrikeyevna gained 1 level of contamination.", createdAt: new Date('2026-01-22T00:00:00Z') },
      { id: 'ses-dk-13', campaignId: 'campaign-drakkenheim', number: 13, title: 'Session 13 — Bag of Holding Destroyed', datetime: '2026-02-05T18:00:00Z', brief: "Bag of Holding destroyed, Katya revealed as cultist fanatic", summary: "Korvin destroyed the Bag of Holding when Katya and other fanatics tried to take it — Katya turned out to be a Followers of the Falling Fire fanatic. Loss of the Bag of Holding means a 500gp debt to Aldor.", createdAt: new Date('2026-02-05T00:00:00Z') },
      { id: 'ses-dk-14', campaignId: 'campaign-drakkenheim', number: 14, title: 'Session 14 — Zoya and Ingredients', datetime: '2026-02-19T18:00:00Z', brief: 'Ingredients for Zoya, Bryce Landry found, Aldor catches up', summary: "Found Sir Bryce Landry — Korvin hit him with Magic Missile in the kneecaps. Gathered ingredients for Zoya's delirium cure. Learned of Johann Ghostweaver who taught Zoya the cure. Aldor caught the party — Korvin left the delirium shard as collateral.", createdAt: new Date('2026-02-19T00:00:00Z') },
      { id: 'ses-dk-15', campaignId: 'campaign-drakkenheim', number: 15, title: "Session 15 — Octopus and River", datetime: '2026-02-26T18:00:00Z', brief: "Octopus Paul, anomaly, crayfish procession, Smi's Palace", summary: "Octopus Paul sucked in Korvin. The party found an anomaly. Met August Elderfire (Gus). Discovered a procession of crayfish immune to contaminated water. Explored Smi's Palace for the night.", createdAt: new Date('2026-02-26T00:00:00Z') },
      { id: 'ses-dk-16', campaignId: 'campaign-drakkenheim', number: 16, title: 'Session 16 — Underground Arena', datetime: '2026-03-09T18:00:00Z', brief: 'Underground Arena, Sai & Patrikeyevna as "Elf and Granny", Aldor demands debt', summary: "Discovered a large underground arena beneath Bent Row. Sai and Patrikeyevna signed up as 'Elf and Granny'. Fights organized by Bull. Korvin chased by Queen's Men and found a cursed fire sword. Locked in cages. Aldor appeared demanding the 500gp debt.", createdAt: new Date('2026-03-09T00:00:00Z') },
      { id: 'ses-dk-17', campaignId: 'campaign-drakkenheim', number: 17, title: 'Session 17 — Aldor, Doppelganger, Escape', datetime: '2026-03-16T18:00:00Z', brief: 'Aldor, Doppelganger, Escape through the sewers', summary: "Aldor appeared demanding the 500gp debt — Korvin paid with the cursed fire sword. A doppelganger impersonating Zoya was scared off. Veronika Yad was found at the Sweaty Bugbear. The party escaped Bent Row through the sewers, fighting a Gelatinous Cube. Chertyaka was released and ran north.", createdAt: new Date('2026-03-16T00:00:00Z') },
    ],
  });

  // Session NPC links
  console.log('Seeding session links...');

  const sessionNpcLinks: { sessionId: string; npcId: string }[] = [
    // Farchester
    { sessionId: 'ses-fc-1', npcId: 'npc-gvilim' },
    { sessionId: 'ses-fc-2', npcId: 'npc-stoungriv' },
    { sessionId: 'ses-fc-2', npcId: 'npc-kronheyv' },
    { sessionId: 'ses-fc-2', npcId: 'npc-edit-hargrave' },
    { sessionId: 'ses-fc-2', npcId: 'npc-eshborn' },
    { sessionId: 'ses-fc-3', npcId: 'npc-tuts' },
    { sessionId: 'ses-fc-3', npcId: 'npc-gvilim' },
    { sessionId: 'ses-fc-4', npcId: 'npc-tuts' },
    { sessionId: 'ses-fc-4', npcId: 'npc-gvilim' },
    { sessionId: 'ses-fc-4', npcId: 'npc-vaysiriel' },
    { sessionId: 'ses-fc-5', npcId: 'npc-gnurk' },
    { sessionId: 'ses-fc-5', npcId: 'npc-yorvert' },
    { sessionId: 'ses-fc-5', npcId: 'npc-stoungriv' },
    // Drakkenheim
    { sessionId: 'ses-dk-1', npcId: 'npc-eren-marlow' },
    { sessionId: 'ses-dk-1', npcId: 'npc-rikard-vos' },
    { sessionId: 'ses-dk-1', npcId: 'npc-bogdan' },
    { sessionId: 'ses-dk-1', npcId: 'npc-raine' },
    { sessionId: 'ses-dk-1', npcId: 'npc-endra-jansen' },
    { sessionId: 'ses-dk-1', npcId: 'npc-ludwig' },
    { sessionId: 'ses-dk-2', npcId: 'npc-eren-marlow' },
    { sessionId: 'ses-dk-2', npcId: 'npc-aldor' },
    { sessionId: 'ses-dk-2', npcId: 'npc-orson' },
    { sessionId: 'ses-dk-2', npcId: 'npc-river' },
    { sessionId: 'ses-dk-2', npcId: 'npc-eldric' },
    { sessionId: 'ses-dk-5', npcId: 'npc-zoya' },
    { sessionId: 'ses-dk-5', npcId: 'npc-orson' },
    { sessionId: 'ses-dk-5', npcId: 'npc-river' },
    { sessionId: 'ses-dk-5', npcId: 'npc-ansom-lang' },
    { sessionId: 'ses-dk-5', npcId: 'npc-armin' },
    { sessionId: 'ses-dk-6', npcId: 'npc-madam-rochelle' },
    { sessionId: 'ses-dk-7', npcId: 'npc-petra-lang' },
    { sessionId: 'ses-dk-10', npcId: 'npc-katya-brown' },
    { sessionId: 'ses-dk-10', npcId: 'npc-lucretia' },
    { sessionId: 'ses-dk-11', npcId: 'npc-muskarina' },
    { sessionId: 'ses-dk-11', npcId: 'npc-bufotenia' },
    { sessionId: 'ses-dk-11', npcId: 'npc-river' },
    { sessionId: 'ses-dk-11', npcId: 'npc-kosta-stavros' },
    { sessionId: 'ses-dk-12', npcId: 'npc-river' },
    { sessionId: 'ses-dk-12', npcId: 'npc-sebastian' },
    { sessionId: 'ses-dk-12', npcId: 'npc-antoine-megara' },
    { sessionId: 'ses-dk-13', npcId: 'npc-katya-brown' },
    { sessionId: 'ses-dk-14', npcId: 'npc-zoya' },
    { sessionId: 'ses-dk-14', npcId: 'npc-bryce-landry' },
    { sessionId: 'ses-dk-14', npcId: 'npc-aldor' },
    { sessionId: 'ses-dk-16', npcId: 'npc-aldor' },
    { sessionId: 'ses-dk-16', npcId: 'npc-bloodhound' },
    { sessionId: 'ses-dk-16', npcId: 'npc-dorian' },
    { sessionId: 'ses-dk-16', npcId: 'npc-chertyaka' },
    { sessionId: 'ses-dk-17', npcId: 'npc-aldor' },
    { sessionId: 'ses-dk-17', npcId: 'npc-mind-reaper' },
    { sessionId: 'ses-dk-17', npcId: 'npc-veronika-yad' },
    { sessionId: 'ses-dk-17', npcId: 'npc-chertyaka' },
  ];

  await prisma.sessionNPC.createMany({ data: sessionNpcLinks });

  // Session Location links
  const sessionLocationLinks: { sessionId: string; locationId: string }[] = [
    // Farchester
    { sessionId: 'ses-fc-1', locationId: 'loc-fc-farchester' },
    { sessionId: 'ses-fc-2', locationId: 'loc-fc-farchester' },
    { sessionId: 'ses-fc-2', locationId: 'loc-fc-rathusha' },
    { sessionId: 'ses-fc-2', locationId: 'loc-fc-residence' },
    { sessionId: 'ses-fc-3', locationId: 'loc-fc-farchester' },
    { sessionId: 'ses-fc-3', locationId: 'loc-fc-tower' },
    { sessionId: 'ses-fc-4', locationId: 'loc-fc-farchester' },
    { sessionId: 'ses-fc-4', locationId: 'loc-fc-tower' },
    { sessionId: 'ses-fc-5', locationId: 'loc-fc-farchester' },
    { sessionId: 'ses-fc-5', locationId: 'loc-fc-tavern' },
    { sessionId: 'ses-fc-5', locationId: 'loc-fc-rathusha' },
  ];

  await prisma.sessionLocation.createMany({ data: sessionLocationLinks });

  console.log('Seeding quests...');

  // ══════════════════════════════════════════════════════════════════════════
  //  QUESTS
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.quest.createMany({
    data: [
      { id: 'q-fc-1', campaignId: 'campaign-farchester', title: 'Find Special Alcohol for Lord-Admiral', description: 'The Lord-Admiral Kronhev requested a very specific brew. The party must obtain it to gain his favour.', giverId: 'npc-kronheyv', status: 'ACTIVE', notes: '1 bottle currently held by Evelina. Alvin broke one. May need to brew more.', createdAt: new Date('2026-02-24T00:00:00Z') },
      { id: 'q-fc-2', campaignId: 'campaign-farchester', title: 'Find Gefara Order Spies', description: 'The Burgher suspects agents of the Gefara Order have infiltrated Farchester.', giverId: 'npc-stoungriv', status: 'ACTIVE', notes: 'Party has official documents from the Burgher (unsealed — just stamp and signature).', createdAt: new Date('2026-02-24T00:00:00Z') },
      { id: 'q-fc-3', campaignId: 'campaign-farchester', title: 'Resolve the Protesters at the Gate', description: 'Goblins and elves are demonstrating outside the city gates. The city wants it dealt with.', giverId: 'npc-stoungriv', status: 'ACTIVE', notes: "Gnurk (goblin leader) wants a special mold from the city. Elves are protesting the city's waste dumping into the forest. Alvin proposed letting delegates enter freely.", createdAt: new Date('2026-02-20T00:00:00Z') },
      { id: 'q-dk-1', campaignId: 'campaign-drakkenheim', title: 'Find Oscar Yoren', description: 'The Amethyst Academy is hiding something about Oscar Yoren.', status: 'UNDISCOVERED', notes: 'What are the Amethysts concealing?', createdAt: new Date('2025-09-01T00:00:00Z') },
      { id: 'q-dk-2', campaignId: 'campaign-drakkenheim', title: "Decipher Copperpot's Note", description: "A note found on Copperpot's corpse written in an unknown language.", giverId: 'npc-rosa-carver', status: 'UNDISCOVERED', notes: '', createdAt: new Date('2025-10-01T00:00:00Z') },
      { id: 'q-dk-3', campaignId: 'campaign-drakkenheim', title: 'Find Johann Ghostweaver', description: 'Who is Johann Ghostweaver and how is he connected to Oscar Yoren?', status: 'UNDISCOVERED', notes: '', createdAt: new Date('2025-10-01T00:00:00Z') },
      { id: 'q-dk-4', campaignId: 'campaign-drakkenheim', title: 'Hooded Lanterns Quest — Infected Potions', description: 'A quest from the Hooded Lanterns involving infected potions at the estate near Eckerman Mill.', giverId: 'npc-karin-alsberg', status: 'ACTIVE', notes: 'Estate near Eckerman Mill. Not yet visited.', createdAt: new Date('2026-01-01T00:00:00Z') },
      { id: 'q-dk-5', campaignId: 'campaign-drakkenheim', title: 'Contact Black Jack', description: "Black Jack at the Hanging Lock tavern — a contact from the Queen's Men.", giverId: 'npc-madam-rochelle', status: 'ACTIVE', notes: "Tiflings 'Deceit and Lies' mentioned Black Jack can offer work for the Queen.", createdAt: new Date('2026-03-16T00:00:00Z') },
      { id: 'q-dk-6', campaignId: 'campaign-drakkenheim', title: "Retrieve Aldor's Research", description: "Aldor had collected field notes on Haze mutation patterns in the Outer City. His research was stored at the Red Lion Hotel.", giverId: 'npc-aldor', status: 'UNAVAILABLE', notes: 'Aldor was killed by the Mind Reaper. The Red Lion is still accessible — research may still be there.', createdAt: new Date('2026-02-01T00:00:00Z') },
    ],
  });

  // Session Quest links
  await prisma.sessionQuest.createMany({
    data: [
      { sessionId: 'ses-fc-2', questId: 'q-fc-1' },
      { sessionId: 'ses-fc-2', questId: 'q-fc-2' },
      { sessionId: 'ses-fc-5', questId: 'q-fc-3' },
      { sessionId: 'ses-dk-5', questId: 'q-dk-1' },
      { sessionId: 'ses-dk-11', questId: 'q-dk-4' },
      { sessionId: 'ses-dk-14', questId: 'q-dk-3' },
      { sessionId: 'ses-dk-16', questId: 'q-dk-5' },
      { sessionId: 'ses-dk-17', questId: 'q-dk-6' },
    ],
  });

  console.log('Seeding group memberships...');

  // ══════════════════════════════════════════════════════════════════════════
  //  NPC GROUP MEMBERSHIPS
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.nPCGroupMembership.createMany({
    data: [
      // ── Farchester ──────────────────────────────────────────────
      // Red Faction
      { npcId: 'npc-kronheyv', groupId: 'faction-fc-red', relation: 'Leader' },
      { npcId: 'npc-edit-hargrave', groupId: 'faction-fc-red', relation: 'Member' },
      // Blue Faction
      { npcId: 'npc-stoungriv', groupId: 'faction-fc-blue', relation: 'Leader' },
      // Goblin Protesters
      { npcId: 'npc-gnurk', groupId: 'group-fc-goblin-protesters', relation: 'Leader' },
      // Elf Representatives
      { npcId: 'npc-elarwen', groupId: 'group-fc-elf-reps', relation: 'Leader' },

      // ── Drakkenheim ─────────────────────────────────────────────
      // Hooded Lanterns
      { npcId: 'npc-drexel', groupId: 'faction-dk-lanterns', relation: 'Leader' },
      { npcId: 'npc-ansom-lang', groupId: 'faction-dk-lanterns', relation: 'Member' },
      { npcId: 'npc-petra-lang', groupId: 'faction-dk-lanterns', relation: 'Member' },
      { npcId: 'npc-raine', groupId: 'faction-dk-lanterns', relation: 'Member' },

      // Queen's Men — Rose and Thorns
      { npcId: 'npc-rosa-carver', groupId: 'faction-dk-queens', relation: 'Leader', subfaction: 'Rose and Thorns' },
      { npcId: 'npc-izrael', groupId: 'faction-dk-queens', relation: 'Member', subfaction: 'Rose and Thorns' },

      // Queen's Men — Wounded Hearts
      { npcId: 'npc-kristian-lam', groupId: 'faction-dk-queens', relation: 'Leader', subfaction: 'Wounded Hearts' },
      { npcId: 'npc-tilda', groupId: 'faction-dk-queens', relation: 'Member', subfaction: 'Wounded Hearts' },
      { npcId: 'npc-dorian', groupId: 'faction-dk-queens', relation: 'Member', subfaction: 'Wounded Hearts' },

      // Queen's Men — Sewer Cobras
      { npcId: 'npc-veronika-yad', groupId: 'faction-dk-queens', relation: 'Leader', subfaction: 'Sewer Cobras' },
      { npcId: 'npc-serpenta', groupId: 'faction-dk-queens', relation: 'Member', subfaction: 'Sewer Cobras' },
      { npcId: 'npc-bufotenia', groupId: 'faction-dk-queens', relation: 'Member', subfaction: 'Sewer Cobras' },
      { npcId: 'npc-muskarina', groupId: 'faction-dk-queens', relation: 'Member', subfaction: 'Sewer Cobras' },

      // Queen's Men — unspecified subfaction
      { npcId: 'npc-bloodhound', groupId: 'faction-dk-queens', relation: 'Member' },
      { npcId: 'npc-tony', groupId: 'faction-dk-queens', relation: 'Member' },

      // Amethyst Academy
      { npcId: 'npc-eldric', groupId: 'faction-dk-amethyst', relation: 'Leader' },
      { npcId: 'npc-river', groupId: 'faction-dk-amethyst', relation: 'Member' },
      { npcId: 'npc-oscar-yoren', groupId: 'faction-dk-amethyst', relation: 'Member' },

      // Followers of the Falling Fire
      { npcId: 'npc-lucretia', groupId: 'faction-dk-flame', relation: 'Leader' },
      { npcId: 'npc-katya-brown', groupId: 'faction-dk-flame', relation: 'Member' },

      // Silver Order
      { npcId: 'npc-bryce-landry', groupId: 'faction-dk-silver', relation: 'Member' },

      // Lang Family
      { npcId: 'npc-ansom-lang', groupId: 'group-dk-lang-family', relation: 'Member' },
      { npcId: 'npc-petra-lang', groupId: 'group-dk-lang-family', relation: 'Member' },

      // Crowe Family
      { npcId: 'npc-tobias-crowe', groupId: 'group-dk-crowe-family', relation: 'Father' },
      { npcId: 'npc-emma-crowe', groupId: 'group-dk-crowe-family', relation: 'Daughter' },

      // Road Travelers
      { npcId: 'npc-rikard-vos', groupId: 'group-dk-road-travelers', relation: 'Member' },
      { npcId: 'npc-ludwig', groupId: 'group-dk-road-travelers', relation: 'Member' },
      { npcId: 'npc-endra-jansen', groupId: 'group-dk-road-travelers', relation: 'Member' },
    ],
  });

  console.log('Seeding NPC location presences...');

  // ══════════════════════════════════════════════════════════════════════════
  //  NPC LOCATION PRESENCES
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.nPCLocationPresence.createMany({
    data: [
      // Farchester
      { npcId: 'npc-kronheyv', locationId: 'loc-fc-residence', note: 'Lives here. Residence.' },
      { npcId: 'npc-stoungriv', locationId: 'loc-fc-rathusha', note: 'Works at the Town Hall.' },
      { npcId: 'npc-edit-hargrave', locationId: 'loc-fc-residence', note: 'Guards the residence.' },
      { npcId: 'npc-yorvert', locationId: 'loc-fc-tavern', note: 'Owner and tavernkeeper.' },
      { npcId: 'npc-tuts', locationId: 'loc-fc-tower', note: 'Lives and works here.' },
      { npcId: 'npc-gvilim', locationId: 'loc-fc-tower', note: 'Apprentice at the tower.' },
      // Drakkenheim
      { npcId: 'npc-drexel', locationId: 'loc-dk-watchtower', note: 'Commands from the watchtower.' },
      { npcId: 'npc-raine', locationId: 'loc-dk-watchtower', note: 'Watch captain.' },
      { npcId: 'npc-rosa-carver', locationId: 'loc-dk-old-imperial-pub', note: 'Base of operations.' },
      { npcId: 'npc-izrael', locationId: 'loc-dk-old-imperial-pub', note: 'Bartender.' },
      { npcId: 'npc-kristian-lam', locationId: 'loc-dk-smis-palace', note: 'Runs the palace.' },
      { npcId: 'npc-tilda', locationId: 'loc-dk-smis-palace', note: 'Waitress.' },
      { npcId: 'npc-veronika-yad', locationId: 'loc-dk-sweaty-bugbear', note: 'Based here.' },
      { npcId: 'npc-bloodhound', locationId: 'loc-dk-sweaty-bugbear', note: 'Arena fighter.' },
      { npcId: 'npc-river', locationId: 'loc-dk-red-lion', note: 'Spends evenings in the library.' },
      { npcId: 'npc-karin-alsberg', locationId: 'loc-dk-bark', note: 'Owner.' },
      { npcId: 'npc-madam-rochelle', locationId: 'loc-dk-gilded-lily', note: 'Owner.' },
      { npcId: 'npc-tobias-crowe', locationId: 'loc-dk-smithy', note: 'Owns the smithy.' },
      { npcId: 'npc-emma-crowe', locationId: 'loc-dk-smithy', note: 'Lives with father.' },
      { npcId: 'npc-aldor', locationId: 'loc-dk-marketplace', note: 'Night market stall.' },
      { npcId: 'npc-orson', locationId: 'loc-dk-marketplace', note: 'Delirium trader at night market.' },
      { npcId: 'npc-armin', locationId: 'loc-dk-marketplace', note: 'Adventuring gear at market.' },
      { npcId: 'npc-eren-marlow', locationId: 'loc-dk-marketplace', note: 'Supply trader at night market.' },
      { npcId: 'npc-lucretia', locationId: 'loc-dk-champions-gate', note: 'Runs the cultist camp.' },
      { npcId: 'npc-zoya', locationId: 'loc-dk-zoya-house', note: 'Lives here (when not missing).' },
      { npcId: 'npc-kosta-stavros', locationId: 'loc-dk-red-lion', note: 'Former owner (deceased).' },
    ],
  });

  console.log('Seeding relations...');

  // ══════════════════════════════════════════════════════════════════════════
  //  RELATIONS
  // ══════════════════════════════════════════════════════════════════════════

  await prisma.relation.createMany({
    data: [
      // ═══════════════════════════════════��════════════════════════════
      //  FARCHESTER CAMPAIGN
      // ════════════════════════════════════════════════════════════════

      // Party (Alvin) <-> Stoungriv
      { campaignId: 'campaign-farchester', fromEntityType: 'character', fromEntityId: 'char-alvin', toEntityType: 'npc', toEntityId: 'npc-stoungriv', friendliness: -40, note: 'Paid us to do his dirty work. Not fully trusted.' },
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-stoungriv', toEntityType: 'character', toEntityId: 'char-alvin', friendliness: 0, note: 'Useful tools, for now.' },

      // Party (Alvin) <-> Kronhev
      { campaignId: 'campaign-farchester', fromEntityType: 'character', fromEntityId: 'char-alvin', toEntityType: 'npc', toEntityId: 'npc-kronheyv', friendliness: -80, note: 'Oppressive authority. Dislikes us on principle.' },
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-kronheyv', toEntityType: 'character', toEntityId: 'char-alvin', friendliness: -40, note: 'Outsiders. Watching closely.' },

      // Kronhev <-> Stoungriv
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-kronheyv', toEntityType: 'npc', toEntityId: 'npc-stoungriv', friendliness: -40, note: 'Necessary underling. Suspected of disloyalty.' },
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-stoungriv', toEntityType: 'npc', toEntityId: 'npc-kronheyv', friendliness: -80, note: 'Authority I must outmanoeuvre, not defy openly.' },

      // Tuts <-> Stoungriv (connection mentioned in NPC data)
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-tuts', toEntityType: 'npc', toEntityId: 'npc-stoungriv', friendliness: 40, note: 'An old arrangement. Mutual interest.' },

      // Esme -> Tuts (helped Gwilym)
      { campaignId: 'campaign-farchester', fromEntityType: 'character', fromEntityId: 'char-esme', toEntityType: 'npc', toEntityId: 'npc-tuts', friendliness: 40, note: 'Helped Gwilym. The mage was impressed.' },

      // Yorvert -> Mirian (father-daughter)
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-yorvert', toEntityType: 'npc', toEntityId: 'npc-mirian', friendliness: 80, note: 'His daughter. Everything.' },
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-mirian', toEntityType: 'npc', toEntityId: 'npc-yorvert', friendliness: 80, note: 'Her father.' },

      // Elarwen -> Kronhev (pollution dispute)
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-elarwen', toEntityType: 'npc', toEntityId: 'npc-kronheyv', friendliness: -80, note: 'Responsible for the pollution killing the forest.' },

      // Blue <-> Red faction rivalry
      { campaignId: 'campaign-farchester', fromEntityType: 'group', fromEntityId: 'faction-fc-blue', toEntityType: 'group', toEntityId: 'faction-fc-red', friendliness: -80, note: 'Open political rivalry. Cold war within city walls.' },
      { campaignId: 'campaign-farchester', fromEntityType: 'group', fromEntityId: 'faction-fc-red', toEntityType: 'group', toEntityId: 'faction-fc-blue', friendliness: -80, note: 'Disloyal faction that undermines martial law.' },

      // Tuts <-> Gnurk (deal about the river)
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-tuts', toEntityType: 'npc', toEntityId: 'npc-gnurk', friendliness: 0, note: 'Made a deal about the river. What exactly was agreed?' },
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-gnurk', toEntityType: 'npc', toEntityId: 'npc-tuts', friendliness: 0, note: 'The gnome who did magic with the river.' },

      // Tuts -> Gvilim (master-apprentice, irritated but cares)
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-tuts', toEntityType: 'npc', toEntityId: 'npc-gvilim', friendliness: 0, note: 'His apprentice. Frustrated by incompetence, secretly values persistence.' },
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-gvilim', toEntityType: 'npc', toEntityId: 'npc-tuts', friendliness: 40, note: 'His master. Intimidating but admired.' },

      // Elarwen <-> Goblin Protesters (both outside the gates)
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-elarwen', toEntityType: 'npc', toEntityId: 'npc-gnurk', friendliness: 0, note: 'Both protest outside the gates. Different causes.' },

      // Stoungriv -> Blue Faction
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-stoungriv', toEntityType: 'group', toEntityId: 'faction-fc-blue', friendliness: 80, note: 'His power base.' },

      // Kronhev -> Red Faction
      { campaignId: 'campaign-farchester', fromEntityType: 'npc', fromEntityId: 'npc-kronheyv', toEntityType: 'group', toEntityId: 'faction-fc-red', friendliness: 80, note: 'His personal guard and enforcers.' },

      // ════════════════════════════════════════════════════════════════
      //  DRAKKENHEIM CAMPAIGN
      // ════════════════════════════════════════════════════════════════

      // Ansom <-> Petra (siblings)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-ansom-lang', toEntityType: 'npc', toEntityId: 'npc-petra-lang', friendliness: 80, note: 'His sister. Asked the party to rescue her.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-petra-lang', toEntityType: 'npc', toEntityId: 'npc-ansom-lang', friendliness: 80, note: 'Her brother. Sent the party to save her.' },

      // Tobias <-> Emma (father-daughter)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-tobias-crowe', toEntityType: 'npc', toEntityId: 'npc-emma-crowe', friendliness: 80, note: 'His daughter.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-emma-crowe', toEntityType: 'npc', toEntityId: 'npc-tobias-crowe', friendliness: 80, note: 'Her father.' },

      // Oscar <-> Sebastian (mentor-student)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-oscar-yoren', toEntityType: 'npc', toEntityId: 'npc-sebastian', friendliness: 0, note: 'Former student. Stole tomes after leaving.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-sebastian', toEntityType: 'npc', toEntityId: 'npc-oscar-yoren', friendliness: 0, note: 'Former mentor. Left on unclear terms.' },

      // Ghostweaver <-> Zoya (taught the cure)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-ghostweaver', toEntityType: 'npc', toEntityId: 'npc-zoya', friendliness: 40, note: 'Taught her the delirium cure.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-zoya', toEntityType: 'npc', toEntityId: 'npc-ghostweaver', friendliness: 40, note: 'Her mentor in the art of healing.' },

      // Ghostweaver <-> Oscar (acquaintances with dealings)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-ghostweaver', toEntityType: 'npc', toEntityId: 'npc-oscar-yoren', friendliness: 0, note: 'Had dealings. Nature unclear.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-oscar-yoren', toEntityType: 'npc', toEntityId: 'npc-ghostweaver', friendliness: 0, note: 'Had dealings. Nature unclear.' },

      // River <-> Oscar (she reacts strangely to his name)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-river', toEntityType: 'npc', toEntityId: 'npc-oscar-yoren', friendliness: -40, note: 'Reacts strangely to his name. Knows something.' },

      // Eldric <-> Oscar (hides information about him)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-eldric', toEntityType: 'npc', toEntityId: 'npc-oscar-yoren', friendliness: 0, note: 'Hides information. What is the secret?' },

      // Drexel <-> Party (allied)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-drexel', toEntityType: 'group', toEntityId: 'group-dk-party', friendliness: 40, note: 'Cooperating. Party rescued Petra Lang.' },

      // Aldor <-> Party/Korvin (debt relationship)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-aldor', toEntityType: 'character', toEntityId: 'char-korvin', friendliness: 0, note: 'Transactional. 500gp debt repaid with cursed fire sword.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'character', fromEntityId: 'char-korvin', toEntityType: 'npc', toEntityId: 'npc-aldor', friendliness: -40, note: 'Dangerous creditor. Debt settled but uneasy.' },

      // Katya <-> Vermira (former classmates, now enemies)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-katya-brown', toEntityType: 'character', toEntityId: 'char-vermira', friendliness: -40, note: 'Former classmate. Defected to cultists after the Sacred Flame Massacre.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'character', fromEntityId: 'char-vermira', toEntityType: 'npc', toEntityId: 'npc-katya-brown', friendliness: -40, note: 'Former classmate turned cultist. Stole the Bag of Holding.' },

      // Zoya <-> Patrikeyevna (close friends)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-zoya', toEntityType: 'character', toEntityId: 'char-patrikeyevna', friendliness: 80, note: 'Loves Patrikeyevna like family.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'character', fromEntityId: 'char-patrikeyevna', toEntityType: 'npc', toEntityId: 'npc-zoya', friendliness: 80, note: 'Close friend. Deeply worried about her disappearance.' },

      // Serpenta <-> Vermira (acquaintances)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-serpenta', toEntityType: 'character', toEntityId: 'char-vermira', friendliness: 0, note: "Vermira's acquaintance in the Sewer Cobras." },

      // Rosa Carver <-> Kristian Lam (rival subfaction leaders)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-rosa-carver', toEntityType: 'npc', toEntityId: 'npc-kristian-lam', friendliness: -40, note: "Rival Queen's Men subfaction leaders. Rose and Thorns vs Wounded Hearts." },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-kristian-lam', toEntityType: 'npc', toEntityId: 'npc-rosa-carver', friendliness: -40, note: "Rival Queen's Men subfaction leaders. Wounded Hearts vs Rose and Thorns." },

      // Rosa Carver <-> Veronika Yad (rival subfaction leaders)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-rosa-carver', toEntityType: 'npc', toEntityId: 'npc-veronika-yad', friendliness: -40, note: "Rival subfaction. Rose and Thorns vs Sewer Cobras." },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-veronika-yad', toEntityType: 'npc', toEntityId: 'npc-rosa-carver', friendliness: -40, note: "Rival subfaction. Sewer Cobras vs Rose and Thorns." },

      // Kristian Lam <-> Veronika Yad
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-kristian-lam', toEntityType: 'npc', toEntityId: 'npc-veronika-yad', friendliness: -40, note: "Rival subfaction. Wounded Hearts vs Sewer Cobras." },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-veronika-yad', toEntityType: 'npc', toEntityId: 'npc-kristian-lam', friendliness: -40, note: "Rival subfaction. Sewer Cobras vs Wounded Hearts." },

      // Faction relations (group to group)
      // Lanterns <-> Queen's Men (uneasy)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-lanterns', toEntityType: 'group', toEntityId: 'faction-dk-queens', friendliness: -40, note: 'Law vs crime. Opposing goals but forced coexistence.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-queens', toEntityType: 'group', toEntityId: 'faction-dk-lanterns', friendliness: -40, note: "Lanterns interfere with business but aren't worth a war." },

      // Lanterns <-> Amethyst (suspicious cooperation)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-lanterns', toEntityType: 'group', toEntityId: 'faction-dk-amethyst', friendliness: 0, note: 'Uneasy allies. The Amethysts hide too much.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-amethyst', toEntityType: 'group', toEntityId: 'faction-dk-lanterns', friendliness: 0, note: 'Useful muscle. Keep them busy.' },

      // Lanterns <-> Silver Order (aligned goals)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-lanterns', toEntityType: 'group', toEntityId: 'faction-dk-silver', friendliness: 40, note: 'Similar goals — restore Drakkenheim. Different methods.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-silver', toEntityType: 'group', toEntityId: 'faction-dk-lanterns', friendliness: 40, note: 'Allies in the restoration effort.' },

      // Amethyst <-> Followers (opposed)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-amethyst', toEntityType: 'group', toEntityId: 'faction-dk-flame', friendliness: -80, note: 'The cult threatens rational study of delirium.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-flame', toEntityType: 'group', toEntityId: 'faction-dk-amethyst', friendliness: -80, note: 'The Academy desecrates the sacred delirium.' },

      // Silver Order <-> Followers (bitter enemies)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-silver', toEntityType: 'group', toEntityId: 'faction-dk-flame', friendliness: -80, note: 'The cult worships what the Order swore to destroy.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'group', fromEntityId: 'faction-dk-flame', toEntityType: 'group', toEntityId: 'faction-dk-silver', friendliness: -80, note: 'The Order would destroy the sacred delirium.' },

      // Rikard <-> Ludwig <-> Endra (travel companions)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-rikard-vos', toEntityType: 'npc', toEntityId: 'npc-ludwig', friendliness: 40, note: 'Travel companion.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-rikard-vos', toEntityType: 'npc', toEntityId: 'npc-endra-jansen', friendliness: 40, note: 'Travel companion.' },
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-ludwig', toEntityType: 'npc', toEntityId: 'npc-endra-jansen', friendliness: 40, note: 'Travel companion.' },

      // Kosta Stavros <-> Mind Reaper (killed and replaced)
      { campaignId: 'campaign-drakkenheim', fromEntityType: 'npc', fromEntityId: 'npc-kosta-stavros', toEntityType: 'npc', toEntityId: 'npc-mind-reaper', friendliness: -80, note: 'Killed and replaced by the doppelganger.' },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
