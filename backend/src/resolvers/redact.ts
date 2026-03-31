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
  alwaysVisible: ['id', 'campaignId', 'name', 'createdAt', 'playerVisible', 'playerVisibleFields'],
  shareable: [
    'aliases', 'type', 'description', 'image', 'mapMarkers', 'biome',
    'settlementPopulation', 'parentLocationId',
  ],
  neverVisible: ['gmNotes'],
};

export const SESSION_FIELDS: EntityFieldDefs = {
  alwaysVisible: ['id', 'campaignId', 'number', 'title', 'createdAt', 'playerVisible', 'playerVisibleFields'],
  shareable: ['datetime', 'brief', 'summary'],
  neverVisible: [],
};

// ── Redaction function ──────────────────────────────────────────────────────

/**
 * Redact fields on an entity for player visibility.
 *
 * - `alwaysVisible` fields are never redacted.
 * - `neverVisible` fields are always set to null.
 * - All other fields are set to null unless they appear in `visibleFields`.
 *
 * Returns a shallow copy with hidden fields nulled out.
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
      (result as Record<string, unknown>)[key] = null;
      continue;
    }
    if (!visibleFields.includes(key)) {
      (result as Record<string, unknown>)[key] = null;
    }
  }
  return result;
}
