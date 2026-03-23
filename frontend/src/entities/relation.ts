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

export function friendlinessLabel(score: number): string {
  if (score >= 61) return 'Allied';
  if (score >= 21) return 'Friendly';
  if (score >= -20) return 'Neutral';
  if (score >= -60) return 'Unfriendly';
  return 'Hostile';
}

export function friendlinessColor(score: number): string {
  if (score >= 61) return 'text-secondary';
  if (score >= 21) return 'text-secondary/70';
  if (score >= -20) return 'text-on-surface-variant';
  if (score >= -60) return 'text-tertiary';
  return 'text-primary';
}

export function friendlinessBarColor(score: number): string {
  if (score >= 61) return 'bg-secondary';
  if (score >= 21) return 'bg-secondary/60';
  if (score >= -20) return 'bg-outline-variant';
  if (score >= -60) return 'bg-tertiary/60';
  return 'bg-primary/80';
}
