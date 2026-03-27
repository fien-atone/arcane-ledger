export type EntityType = 'npc' | 'character' | 'group';

export interface EntityRef {
  type: EntityType;
  id: string;
}

/**
 * A directional social relation between two entities.
 * fromEntity → toEntity with a friendliness score from -100 (hostile) to +100 (devoted ally).
 * A → B and B → A are independent records.
 */
export interface Relation {
  id: string;
  campaignId: string;
  fromEntity: EntityRef;
  toEntity: EntityRef;
  /** -100 (hostile) to +100 (devoted ally) */
  friendliness: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** Snap any score to the nearest of the 5 canonical levels */
export function snapFriendliness(score: number): number {
  const levels = [-80, -40, 0, 40, 80];
  return levels.reduce((prev, curr) => Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev);
}

export function friendlinessLabel(score: number): string {
  const s = snapFriendliness(score);
  if (s >= 80) return 'Allied';
  if (s >= 40) return 'Friendly';
  if (s >= 0) return 'Neutral';
  if (s >= -40) return 'Unfriendly';
  return 'Hostile';
}

export function friendlinessColor(score: number): string {
  const s = snapFriendliness(score);
  if (s >= 80) return 'text-emerald-400';
  if (s >= 40) return 'text-emerald-400/70';
  if (s >= 0) return 'text-amber-400';
  if (s >= -40) return 'text-rose-400/70';
  return 'text-rose-400';
}
