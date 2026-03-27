import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default GM user
  const password = await bcrypt.hash('user', 10);
  const user = await prisma.user.upsert({
    where: { email: 'gm@arcaneledger.app' },
    update: {},
    create: {
      id: 'user-gm',
      email: 'gm@arcaneledger.app',
      password,
      name: 'Game Master',
    },
  });

  console.log(`  ✓ User: ${user.name} (${user.email})`);

  // Seed location types
  const locationTypes = [
    { id: 'plane',      name: 'Plane',       icon: 'public',          category: 'world',        biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'city',       name: 'City',        icon: 'apartment',       category: 'civilization',  biomeOptions: [] as string[],  isSettlement: true,  builtin: true },
    { id: 'town',       name: 'Town',        icon: 'location_city',   category: 'civilization',  biomeOptions: [] as string[],  isSettlement: true,  builtin: true },
    { id: 'village',    name: 'Village',     icon: 'cottage',         category: 'civilization',  biomeOptions: [] as string[],  isSettlement: true,  builtin: true },
    { id: 'settlement', name: 'Settlement',  icon: 'holiday_village', category: 'civilization',  biomeOptions: [] as string[],  isSettlement: true,  builtin: true },
    { id: 'district',   name: 'District',    icon: 'domain',          category: 'civilization',  biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'building',   name: 'Building',    icon: 'house',           category: 'civilization',  biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'continent',  name: 'Continent',   icon: 'map',             category: 'geographic',    biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'region',     name: 'Region',      icon: 'terrain',         category: 'geographic',    biomeOptions: ['island', 'peninsula', 'cape'], isSettlement: false, builtin: true },
    { id: 'wilderness', name: 'Wilderness',  icon: 'forest',          category: 'geographic',    biomeOptions: ['forest', 'desert', 'plains', 'tundra', 'jungle', 'badlands', 'savanna', 'steppe'], isSettlement: false, builtin: true },
    { id: 'highland',   name: 'Highland',    icon: 'landscape',       category: 'geographic',    biomeOptions: ['mountain_range', 'peak', 'plateau', 'valley', 'pass', 'cliff'], isSettlement: false, builtin: true },
    { id: 'ocean',      name: 'Ocean',       icon: 'waves',           category: 'water',         biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'river',      name: 'River',       icon: 'stream',          category: 'water',         biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'lake',       name: 'Lake',        icon: 'water',           category: 'water',         biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'bay',        name: 'Bay / Gulf',  icon: 'water_full',      category: 'water',         biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'marsh',      name: 'Marsh / Bog', icon: 'grass',           category: 'water',         biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'delta',      name: 'Delta',       icon: 'merge',           category: 'water',         biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'dungeon',    name: 'Dungeon',     icon: 'skull',           category: 'poi',           biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'landmark',   name: 'Landmark',    icon: 'place',           category: 'poi',           biomeOptions: [] as string[],  isSettlement: false, builtin: true },
    { id: 'route',      name: 'Route',       icon: 'route',           category: 'travel',        biomeOptions: ['road', 'trade_route', 'river_route', 'sea_lane', 'mountain_pass', 'tunnel'], isSettlement: false, builtin: true },
  ];

  for (const lt of locationTypes) {
    await prisma.locationType.upsert({
      where: { id: lt.id },
      update: {},
      create: lt,
    });
  }
  console.log(`  ✓ ${locationTypes.length} location types`);

  // Seed species
  const speciesList = [
    { id: 'species-human',    name: 'Human',    pluralName: 'Humans',    type: 'humanoid', size: 'medium' },
    { id: 'species-elf',      name: 'Elf',      pluralName: 'Elves',     type: 'humanoid', size: 'medium' },
    { id: 'species-dwarf',    name: 'Dwarf',    pluralName: 'Dwarves',   type: 'humanoid', size: 'medium' },
    { id: 'species-halfling', name: 'Halfling', pluralName: 'Halflings', type: 'humanoid', size: 'small' },
    { id: 'species-gnome',    name: 'Gnome',    pluralName: 'Gnomes',    type: 'humanoid', size: 'small' },
    { id: 'species-orc',      name: 'Orc',      pluralName: 'Orcs',      type: 'humanoid', size: 'medium' },
    { id: 'species-goblin',   name: 'Goblin',   pluralName: 'Goblins',   type: 'humanoid', size: 'small' },
    { id: 'species-tiefling', name: 'Tiefling', pluralName: 'Tieflings', type: 'humanoid', size: 'medium' },
    { id: 'species-dragonborn', name: 'Dragonborn', pluralName: 'Dragonborn', type: 'humanoid', size: 'medium' },
  ];

  for (const sp of speciesList) {
    await prisma.species.upsert({
      where: { id: sp.id },
      update: {},
      create: sp,
    });
  }
  console.log(`  ✓ ${speciesList.length} species`);

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
