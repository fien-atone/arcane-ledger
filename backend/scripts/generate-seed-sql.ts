import { readFileSync } from 'fs';
import { join } from 'path';

const MOCK_DIR = join(import.meta.dirname!, '../../frontend/src/shared/api/mockData');

function esc(s: string | undefined | null): string {
  if (s == null) return 'NULL';
  return `'${s.replace(/'/g, "''")}'`;
}

function arrLit(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "'{}'";
  return `ARRAY[${arr.map(a => esc(a)).join(',')}]`;
}

function parseArrayFromTS(content: string): any[] {
  // Strip TS-specific syntax to make it valid JS
  let code = content
    .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
    .replace(/export\s+/g, '')
    .replace(/:\s*\w+(\[\])?\s*(?==)/g, '')  // strip type annotations before =
    .replace(/as\s+const/g, '')
    .replace(/\btype\b\s+\w+\s*=\s*[^;]+;/g, '')  // strip type declarations
    .replace(/\|\s*['"][\w]+['"]/g, '');  // strip union type members

  // Find the array
  const match = code.match(/(?:const|let|var)\s+(\w+)\s*=\s*(\[[\s\S]*\]);/);
  if (!match) return [];

  try {
    return eval(`(${match[2]})`);
  } catch (e) {
    console.error('Parse error:', (e as Error).message);
    return [];
  }
}

function loadMock(filename: string): any[] {
  const content = readFileSync(join(MOCK_DIR, filename), 'utf-8');
  return parseArrayFromTS(content);
}

const statusMap: Record<string, string> = { alive: 'ALIVE', dead: 'DEAD', missing: 'MISSING', unknown: 'UNKNOWN' };
const genderMap: Record<string, string> = { male: 'MALE', female: 'FEMALE', nonbinary: 'NONBINARY' };
const questStatusMap: Record<string, string> = { active: 'ACTIVE', completed: 'COMPLETED', failed: 'FAILED', unavailable: 'UNAVAILABLE', undiscovered: 'UNDISCOVERED' };

const npcs = loadMock('npcs.ts').filter((n: any) => n.campaignId === 'campaign-drakkenheim');
const locations = loadMock('locations.ts').filter((l: any) => l.campaignId === 'campaign-drakkenheim');
const sessions = loadMock('sessions.ts').filter((s: any) => s.campaignId === 'campaign-drakkenheim');
const quests = loadMock('quests.ts').filter((q: any) => q.campaignId === 'campaign-drakkenheim');
const characters = loadMock('characters.ts').filter((c: any) => c.campaignId === 'campaign-drakkenheim');

const L: string[] = [];
const p = (s: string) => L.push(s);

p('-- ══════════════════════════════════════════════════════════════════');
p('-- Seed: reference data + Drakkenheim (test) campaign');
p('-- Generated from frontend mock data');
p('-- ══════════════════════════════════════════════════════════════════');
p('');

// User
p("INSERT INTO \"User\" (id, email, password, name, \"createdAt\") VALUES");
p("  ('user-gm', 'gm@arcaneledger.app', '$2a$10$Vi8i2R156LbLxdr13dXYwO..Q82dHmSKFJX.RVFbrAZtFN2Pg7bLa', 'Game Master', NOW())");
p('ON CONFLICT (id) DO NOTHING;');
p('');

// Location Types
p('-- Location Types');
const ltRows = [
  "('plane','Plane','public','world','{}',false,true,NOW())",
  "('city','City','apartment','civilization','{}',true,true,NOW())",
  "('town','Town','location_city','civilization','{}',true,true,NOW())",
  "('village','Village','cottage','civilization','{}',true,true,NOW())",
  "('settlement','Settlement','holiday_village','civilization','{}',true,true,NOW())",
  "('district','District','domain','civilization','{}',false,true,NOW())",
  "('building','Building','house','civilization','{}',false,true,NOW())",
  "('continent','Continent','map','geographic','{}',false,true,NOW())",
  "('region','Region','terrain','geographic',ARRAY['island','peninsula','cape'],false,true,NOW())",
  "('wilderness','Wilderness','forest','geographic',ARRAY['forest','desert','plains','tundra','jungle','badlands','savanna','steppe'],false,true,NOW())",
  "('highland','Highland','landscape','geographic',ARRAY['mountain_range','peak','plateau','valley','pass','cliff'],false,true,NOW())",
  "('ocean','Ocean','waves','water','{}',false,true,NOW())",
  "('river','River','stream','water','{}',false,true,NOW())",
  "('lake','Lake','water','water','{}',false,true,NOW())",
  "('bay','Bay / Gulf','water_full','water','{}',false,true,NOW())",
  "('marsh','Marsh / Bog','grass','water','{}',false,true,NOW())",
  "('delta','Delta','merge','water','{}',false,true,NOW())",
  "('dungeon','Dungeon','skull','poi','{}',false,true,NOW())",
  "('landmark','Landmark','place','poi','{}',false,true,NOW())",
  "('route','Route','route','travel',ARRAY['road','trade_route','river_route','sea_lane','mountain_pass','tunnel'],false,true,NOW())",
];
p(`INSERT INTO "LocationType" (id, name, icon, category, "biomeOptions", "isSettlement", builtin, "createdAt") VALUES`);
p(ltRows.map(r => `  ${r}`).join(',\n'));
p('ON CONFLICT (id) DO NOTHING;');
p('');

// Group Types
p('-- Group Types');
p(`INSERT INTO "GroupType" (id, name, icon, description, "createdAt") VALUES`);
p([
  "  ('faction','Faction','flag','Political or military powers.',NOW())",
  "  ('guild','Guild','handshake','Professional organisations.',NOW())",
  "  ('family','Family','family_restroom','Blood-related or adopted kin.',NOW())",
  "  ('religion','Religion','auto_awesome','Faiths, cults, and divine orders.',NOW())",
  "  ('criminal','Criminal Org.','warning','Underworld syndicates.',NOW())",
  "  ('military','Military / Order','military_tech','Armed forces and orders.',NOW())",
  "  ('academy','Academy','school','Institutions of learning.',NOW())",
  "  ('secret','Secret Society','visibility_off','Hidden organisations.',NOW())",
].join(',\n'));
p('ON CONFLICT (id) DO NOTHING;');
p('');

// Species
p('-- Species');
p(`INSERT INTO "Species" (id, name, "pluralName", type, size, "createdAt") VALUES`);
p([
  "  ('species-human','Human','Humans','humanoid','medium',NOW())",
  "  ('species-elf','Elf','Elves','humanoid','medium',NOW())",
  "  ('species-dwarf','Dwarf','Dwarves','humanoid','medium',NOW())",
  "  ('species-halfling','Halfling','Halflings','humanoid','small',NOW())",
  "  ('species-gnome','Gnome','Gnomes','humanoid','small',NOW())",
  "  ('species-orc','Orc','Orcs','humanoid','medium',NOW())",
  "  ('species-goblin','Goblin','Goblins','humanoid','small',NOW())",
  "  ('species-tiefling','Tiefling','Tieflings','humanoid','medium',NOW())",
  "  ('species-dragonborn','Dragonborn','Dragonborn','humanoid','medium',NOW())",
].join(',\n'));
p('ON CONFLICT (id) DO NOTHING;');
p('');

// Campaign
p('-- Test Campaign: Drakkenheim');
p(`INSERT INTO "Campaign" (id, title, description, "createdAt") VALUES`);
p(`  ('campaign-drakkenheim', 'Drakkenheim (test)', 'Test campaign: a ruined city blanketed in deliriite. Five factions fight for control.', NOW())`);
p('ON CONFLICT (id) DO NOTHING;');
p(`INSERT INTO "CampaignMember" (id, "campaignId", "userId", role, "joinedAt") VALUES`);
p(`  (gen_random_uuid(), 'campaign-drakkenheim', 'user-gm', 'GM', NOW())`);
p(`ON CONFLICT ("campaignId", "userId") DO NOTHING;`);
p('');

// Groups
p('-- Groups');
const grps = [
  { id: 'faction-dk-lanterns', name: 'The Hooded Lanterns', type: 'military', aliases: ['Фонари','Lanterns'], desc: 'Охраняют Эмбервуд.', goals: 'Восстановить Дракенхейм.', sym: 'Фонарь', rel: 'allied' },
  { id: 'faction-dk-queens', name: "Queen's Men", type: 'criminal', aliases: ['Люди Королевы'], desc: 'Разбойники. Красный ромб.', goals: 'Контроль.', sym: 'Красный ромб', rel: 'neutral' },
  { id: 'faction-dk-amethyst', name: 'The Amethyst Academy', type: 'academy', aliases: ['Аметистовая Академия'], desc: 'Магическая организация.', goals: 'Монополия на делириум.', sym: 'Аметистовый кристалл', rel: 'unknown' },
  { id: 'faction-dk-flame', name: 'The Followers of the Falling Fire', type: 'religion', aliases: ['Падшее Пламя'], desc: 'Культ делириума.', goals: 'Распространение культа.', sym: 'Падающая звезда', rel: 'hostile' },
  { id: 'faction-dk-silver', name: 'Knights of the Silver Order', type: 'military', aliases: ['Серебряный Орден'], desc: 'Рыцари против делириума.', goals: 'Уничтожение делириума.', sym: 'Серебряный щит', rel: 'neutral' },
];
for (const g of grps) {
  p(`INSERT INTO "Group" (id, "campaignId", name, type, aliases, description, goals, symbols, "partyRelation", "createdAt", "updatedAt") VALUES (${esc(g.id)}, 'campaign-drakkenheim', ${esc(g.name)}, ${esc(g.type)}, ${arrLit(g.aliases)}, ${esc(g.desc)}, ${esc(g.goals)}, ${esc(g.sym)}, ${esc(g.rel)}, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`);
}
p('');

// NPCs
p(`-- NPCs (${npcs.length})`);
for (const n of npcs) {
  p(`INSERT INTO "NPC" (id, "campaignId", name, aliases, status, gender, age, species, "speciesId", appearance, personality, description, motivation, flaws, "gmNotes", "createdAt", "updatedAt") VALUES (${esc(n.id)}, 'campaign-drakkenheim', ${esc(n.name)}, ${arrLit(n.aliases)}, '${statusMap[n.status]||'ALIVE'}', ${n.gender?`'${genderMap[n.gender]}'`:'NULL'}, ${n.age??'NULL'}, ${esc(n.species)}, ${esc(n.speciesId)}, ${esc(n.appearance)}, ${esc(n.personality)}, ${esc(n.description)}, ${esc(n.motivation)}, ${esc(n.flaws)}, ${esc(n.gmNotes)}, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`);
  for (const lp of (n.locationPresences ?? [])) {
    p(`INSERT INTO "NPCLocationPresence" (id, "npcId", "locationId", note) VALUES (gen_random_uuid(), ${esc(n.id)}, ${esc(lp.locationId)}, ${esc(lp.note)}) ON CONFLICT ("npcId", "locationId") DO NOTHING;`);
  }
  for (const gm of (n.groupMemberships ?? [])) {
    p(`INSERT INTO "NPCGroupMembership" (id, "npcId", "groupId", relation, subfaction) VALUES (gen_random_uuid(), ${esc(n.id)}, ${esc(gm.groupId)}, ${esc(gm.relation)}, ${esc(gm.subfaction)}) ON CONFLICT ("npcId", "groupId") DO NOTHING;`);
  }
}
p('');

// Locations
p(`-- Locations (${locations.length})`);
for (const l of locations) {
  p(`INSERT INTO "Location" (id, "campaignId", name, aliases, type, "settlementPopulation", biome, "parentLocationId", description, "gmNotes", "createdAt") VALUES (${esc(l.id)}, 'campaign-drakkenheim', ${esc(l.name)}, ${arrLit(l.aliases)}, ${esc(l.type)}, ${l.settlementPopulation??'NULL'}, ${esc(l.biome)}, ${esc(l.parentLocationId)}, ${esc(l.description)}, ${esc(l.gmNotes)}, NOW()) ON CONFLICT (id) DO NOTHING;`);
}
p('');

// Sessions
p(`-- Sessions (${sessions.length})`);
for (const s of sessions) {
  p(`INSERT INTO "Session" (id, "campaignId", number, title, datetime, brief, summary, "createdAt") VALUES (${esc(s.id)}, 'campaign-drakkenheim', ${s.number}, ${esc(s.title)}, ${esc(s.datetime||'')}, ${esc(s.brief)}, ${esc(s.summary)}, NOW()) ON CONFLICT (id) DO NOTHING;`);
  for (const nId of (s.npcIds ?? [])) {
    p(`INSERT INTO "SessionNPC" ("sessionId", "npcId") VALUES (${esc(s.id)}, ${esc(nId)}) ON CONFLICT DO NOTHING;`);
  }
  for (const lId of (s.locationIds ?? [])) {
    p(`INSERT INTO "SessionLocation" ("sessionId", "locationId") VALUES (${esc(s.id)}, ${esc(lId)}) ON CONFLICT DO NOTHING;`);
  }
}
p('');

// Quests
p(`-- Quests (${quests.length})`);
for (const q of quests) {
  p(`INSERT INTO "Quest" (id, "campaignId", title, description, "giverId", reward, status, notes, "createdAt") VALUES (${esc(q.id)}, 'campaign-drakkenheim', ${esc(q.title)}, ${esc(q.description)}, ${esc(q.giverId)}, ${esc(q.reward)}, '${questStatusMap[q.status]||'UNDISCOVERED'}', ${esc(q.notes)}, NOW()) ON CONFLICT (id) DO NOTHING;`);
}
p('');

// Characters
p(`-- Player Characters (${characters.length})`);
for (const c of characters) {
  p(`INSERT INTO "PlayerCharacter" (id, "campaignId", "userId", name, gender, age, species, "speciesId", class, appearance, background, personality, motivation, bonds, flaws, "gmNotes", "createdAt", "updatedAt") VALUES (${esc(c.id)}, 'campaign-drakkenheim', 'user-gm', ${esc(c.name)}, ${c.gender?`'${genderMap[c.gender]}'`:'NULL'}, ${c.age??'NULL'}, ${esc(c.species)}, ${esc(c.speciesId)}, ${esc(c.class)}, ${esc(c.appearance)}, ${esc(c.background)}, ${esc(c.personality)}, ${esc(c.motivation)}, ${esc(c.bonds)}, ${esc(c.flaws)}, ${esc(c.gmNotes||'')}, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`);
}

console.log(L.join('\n'));
