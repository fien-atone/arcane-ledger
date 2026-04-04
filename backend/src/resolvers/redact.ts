/**
 * Field redaction for player visibility.
 *
 * When a player views an entity, fields not in `playerVisibleFields` are nulled out.
 * Some fields are always visible (id, name, etc.) and some are never visible (gmNotes).
 */

// ── Per-entity field definitions ────────────────────────────────────────────

export interface EntityFieldDefs {
  alwaysVisible: string[];
  shareable: string[];
  neverVisible: string[];
  /** Fields that are GraphQL enums — must be nulled (not emptied to "") when hidden */
  enumFields?: string[];
}

export const NPC_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'name', 'status', 'createdAt', 'updatedAt', 'playerVisible', 'playerVisibleFields'],
  shareable: [
    'aliases', 'gender', 'age', 'species', 'speciesId',
    'appearance', 'personality', 'description', 'motivation', 'flaws', 'image',
  ],
  neverVisible: ['gmNotes'],
  enumFields: ['status', 'gender'],
};

export const LOCATION_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'name', 'type', 'biome', 'parentLocationId', 'mapMarkers', 'createdAt', 'playerVisible', 'playerVisibleFields'],
  shareable: [
    'description', 'image',
    'settlementPopulation',
  ],
  neverVisible: ['gmNotes'],
};

export const QUEST_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'title', 'status', 'giverId', 'createdAt', 'playerVisible', 'playerVisibleFields'],
  shareable: ['description', 'reward'],
  neverVisible: ['notes'],
  enumFields: ['status'],
};

export const GROUP_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'name', 'type', 'createdAt', 'updatedAt', 'playerVisible', 'playerVisibleFields'],
  shareable: ['aliases', 'description', 'goals', 'symbols', 'partyRelation'],
  neverVisible: ['gmNotes'],
};

// ── Redaction function ──────────────────────────────────────────────────────

/** Return a safe "empty" value that won't violate GraphQL non-nullable constraints. */
function emptyValue(val: unknown): unknown {
  if (Array.isArray(val)) return [];
  if (typeof val === 'string') return '';
  if (typeof val === 'number') return null;
  if (typeof val === 'boolean') return false;
  return null;
}

/**
 * Redact fields on an entity for player visibility.
 *
 * - `alwaysVisible` fields are never redacted.
 * - `neverVisible` fields are always blanked.
 * - All other fields are blanked unless they appear in `visibleFields`.
 *
 * Returns a shallow copy with hidden fields set to safe empty values.
 */
export function redactEntity<T extends Record<string, unknown>>(
  entity: T,
  visibleFields: string[],
  fieldDefs: EntityFieldDefs,
): T {
  const result = { ...entity };
  const enumSet = new Set(fieldDefs.enumFields ?? []);
  for (const key of Object.keys(result)) {
    if (fieldDefs.alwaysVisible.includes(key)) continue;
    if (fieldDefs.neverVisible.includes(key)) {
      (result as Record<string, unknown>)[key] = enumSet.has(key) ? null : emptyValue(result[key]);
      continue;
    }
    if (!visibleFields.includes(key)) {
      (result as Record<string, unknown>)[key] = enumSet.has(key) ? null : emptyValue(result[key]);
    }
  }
  return result;
}
