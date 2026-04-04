import type { NpcStatus } from '@/entities/npc';

export interface GraphNode {
  id: string;
  name: string;
  status: NpcStatus;
  image?: string;
  groupIds: string[];
  relationCount: number;
  /** Computed by d3-force */
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  friendliness: number;
  note?: string;
  /** True when both A->B and B->A exist — render as curve */
  isBidirectional: boolean;
  /** For bidirectional pairs: 1 or -1 to offset the curve */
  curveDirection: number;
}

export interface GraphGroup {
  id: string;
  name: string;
  colorIndex: number;
  memberNodeIds: string[];
  /** Cluster center X */
  cx: number;
  /** Cluster center Y */
  cy: number;
}

const BASE_HULL_COLORS = [
  '#f2ca50', '#14b8a6', '#a78bfa', '#f87171',
  '#60a5fa', '#fb923c', '#34d399', '#f472b6',
];

/** Returns a color for a group by index. Uses base palette first, then generates via HSL. */
export function getGroupColor(index: number): string {
  if (index < BASE_HULL_COLORS.length) return BASE_HULL_COLORS[index];
  const hue = (index * 137.508) % 360; // golden angle for max spread
  return `hsl(${Math.round(hue)}, 65%, 60%)`;
}

/** @deprecated Use getGroupColor(index) instead */
export const GROUP_HULL_COLORS = BASE_HULL_COLORS;

/** Dedicated color for the virtual party group */
export const PARTY_GROUP_COLOR = '#e2e8f0';

export const FRIENDLINESS_COLORS: Record<string, string> = {
  Allied: '#34d399',
  Friendly: '#4ade80',
  Neutral: '#fbbf24',
  Unfriendly: '#fb923c',
  Hostile: '#f87171',
};

export const STATUS_DOT_COLORS: Record<NpcStatus, string> = {
  alive: '#4ade80',
  dead: '#6b7280',
  missing: '#a1a1aa',
  unknown: '#71717a',
};

export const STATUS_STROKE_COLORS: Record<NpcStatus, string> = {
  alive: '#4ade80',
  dead: '#4b5563',
  missing: '#78716c',
  unknown: '#52525b',
};
