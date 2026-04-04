export interface VisibilityFieldDef {
  key: string;
  label: string;
}

// ── NPC ─────────────────────────────────────────────────────────────────────

export const NPC_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'aliases', label: 'Aliases' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'species', label: 'Species' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'personality', label: 'Personality' },
  { key: 'description', label: 'Background' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'flaws', label: 'Flaws' },
  { key: 'image', label: 'Portrait' },
];

export const NPC_BASIC_PRESET = ['aliases', 'species', 'description', 'image'];

// ── Location ────────────────────────────────────────────────────────────────

export const LOCATION_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', label: 'Description' },
  { key: 'image', label: 'Image / Map' },
  { key: 'settlementPopulation', label: 'Population' },
];

export const LOCATION_BASIC_PRESET = ['description', 'image'];

// ── Quest ───────────────────────────────────────────────────────────────────

export const QUEST_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', label: 'Description' },
  { key: 'reward', label: 'Reward' },
];

export const QUEST_BASIC_PRESET = ['description'];

// ── Group ──────────────────────────────────────────────────────────────────

export const GROUP_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', label: 'Description' },
  { key: 'goals', label: 'Goals' },
  { key: 'symbols', label: 'Symbols' },
  { key: 'aliases', label: 'Aliases' },
];

export const GROUP_BASIC_PRESET = ['description'];
