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
}

export const NPC_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'name', 'createdAt', 'updatedAt', 'playerVisible', 'playerVisibleFields'],
  shareable: [
    'aliases', 'status', 'gender', 'age', 'species', 'speciesId',
    'appearance', 'personality', 'description', 'motivation', 'flaws', 'image',
  ],
  neverVisible: ['gmNotes'],
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
  alwaysVisible: ['id', 'campaignId', 'title', 'status', 'createdAt', 'playerVisible', 'playerVisibleFields'],
  shareable: ['description', 'reward', 'giverId'],
  neverVisible: ['notes'],
};

export const SESSION_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'number', 'title', 'datetime', 'createdAt', 'playerVisible', 'playerVisibleFields'],
  shareable: ['brief'],
  neverVisible: ['summary'],
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
  for (const key of Object.keys(result)) {
    if (fieldDefs.alwaysVisible.includes(key)) continue;
    if (fieldDefs.neverVisible.includes(key)) {
      (result as Record<string, unknown>)[key] = emptyValue(result[key]);
      continue;
    }
    if (!visibleFields.includes(key)) {
      (result as Record<string, unknown>)[key] = emptyValue(result[key]);
    }
  }
  return result;
}
