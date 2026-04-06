export interface VisibilityFieldDef {
  key: string;
  /** Translation key — resolved via t() in VisibilityPanel */
  labelKey: string;
}

// ── NPC ─────────────────────────────────────────────────────────────────────

export const NPC_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'aliases', labelKey: 'npcs:field_aliases' },
  { key: 'gender', labelKey: 'npcs:field_gender' },
  { key: 'age', labelKey: 'npcs:field_age' },
  { key: 'species', labelKey: 'npcs:field_species' },
  { key: 'appearance', labelKey: 'npcs:section_appearance' },
  { key: 'personality', labelKey: 'npcs:section_personality' },
  { key: 'description', labelKey: 'npcs:section_background' },
  { key: 'motivation', labelKey: 'npcs:section_motivation' },
  { key: 'flaws', labelKey: 'npcs:section_flaws' },
  { key: 'image', labelKey: 'npcs:field_portrait' },
];

export const NPC_BASIC_PRESET = ['aliases', 'species', 'description', 'image'];

// ── Location ────────────────────────────────────────────────────────────────

export const LOCATION_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', labelKey: 'locations:section_description' },
  { key: 'image', labelKey: 'locations:field_image_map' },
  { key: 'settlementPopulation', labelKey: 'locations:field_population' },
];

export const LOCATION_BASIC_PRESET = ['description', 'image'];

// ── Quest ───────────────────────────────────────────────────────────────────

export const QUEST_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', labelKey: 'quests:section_description' },
  { key: 'reward', labelKey: 'quests:section_reward' },
];

export const QUEST_BASIC_PRESET = ['description'];

// ── Group ──────────────────────────────────────────────────────────────────

export const GROUP_VISIBILITY_FIELDS: VisibilityFieldDef[] = [
  { key: 'description', labelKey: 'groups:section_about' },
  { key: 'goals', labelKey: 'groups:section_goals' },
  { key: 'symbols', labelKey: 'groups:section_symbols' },
  { key: 'aliases', labelKey: 'groups:field_aliases' },
];

export const GROUP_BASIC_PRESET = ['description'];
