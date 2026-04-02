export interface VisibilityFieldDef {
  key: string;
  label: string;
}

// ── NPC ─────────────────────────────────────────────────────────────────────

export const NPC_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'aliases', label: 'Aliases' },
  { key: 'status', label: 'Status' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'species', label: 'Species' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'personality', label: 'Personality' },
  { key: 'description', label: 'Background' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'flaws', label: 'Flaws' },
  { key: 'image', label: 'Portrait' },
  { key: 'locationPresences', label: 'Known locations' },
  { key: 'groupMemberships', label: 'Group affiliations' },
  { key: 'questsGiven', label: 'Quests given' },
];

export const NPC_BASIC_PRESET = ['aliases', 'status', 'species', 'description', 'image'];

// ── Location ────────────────────────────────────────────────────────────────

export const LOCATION_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', label: 'Description' },
  { key: 'image', label: 'Image / Map' },
  { key: 'settlementPopulation', label: 'Population' },
];

export const LOCATION_BASIC_PRESET = ['description', 'image'];

// ── Session ─────────────────────────────────────────────────────────────────

export const SESSION_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'number', label: 'Session number' },
  { key: 'datetime', label: 'Date' },
  { key: 'brief', label: 'Brief' },
  { key: 'summary', label: 'Summary' },
  { key: 'npcs', label: 'Linked NPCs' },
  { key: 'locations', label: 'Linked locations' },
  { key: 'quests', label: 'Linked quests' },
];

export const SESSION_BASIC_PRESET = ['number', 'datetime', 'brief'];
