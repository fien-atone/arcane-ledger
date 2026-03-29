import { useMemo } from 'react';
import type { NPC } from '@/entities/npc';
import type { Relation } from '@/entities/relation';
import type { Group } from '@/entities/group';
import type { NpcStatus } from '@/entities/npc';
import { GROUP_HULL_COLORS } from './graphTypes';

export interface ChordNode {
  id: string;
  name: string;
  status: NpcStatus;
  image?: string;
  groupIds: string[];
  /** Angle in radians on the circle */
  angle: number;
  x: number;
  y: number;
}

export interface Chord {
  id: string;
  sourceId: string;
  targetId: string;
  friendliness: number;
  note?: string;
  sourceAngle: number;
  targetAngle: number;
}

export interface ChordGroup {
  id: string;
  name: string;
  colorIndex: number;
  startAngle: number;
  endAngle: number;
  /** 0 = inner ring, 1 = outer ring (for overlapping groups) */
  ring: number;
}

interface ChordLayoutResult {
  nodes: ChordNode[];
  chords: Chord[];
  groups: ChordGroup[];
  cx: number;
  cy: number;
  radius: number;
}

export function useChordLayout(
  npcs: NPC[],
  groups: Group[],
  relations: Relation[],
  width: number,
  height: number,
): ChordLayoutResult {
  return useMemo(() => {
    const empty: ChordLayoutResult = { nodes: [], chords: [], groups: [], cx: 0, cy: 0, radius: 0 };
    if (npcs.length === 0 || width === 0 || height === 0) return empty;

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.25;

    // Build NPC-to-group mapping
    const npcToGroups = new Map<string, string[]>();
    for (const npc of npcs) {
      const memberGroupIds = (npc.groupMemberships ?? [])
        .map((m) => m.groupId)
        .filter((gid) => groups.some((g) => g.id === gid));
      npcToGroups.set(npc.id, memberGroupIds);
    }

    // Sort NPCs: grouped first (sorted by group), ungrouped at end
    const groupOrder = new Map(groups.map((g, i) => [g.id, i]));

    const sorted = [...npcs].sort((a, b) => {
      const aGroups = npcToGroups.get(a.id) ?? [];
      const bGroups = npcToGroups.get(b.id) ?? [];
      const aFirst = aGroups.length > 0 ? (groupOrder.get(aGroups[0]) ?? Infinity) : Infinity;
      const bFirst = bGroups.length > 0 ? (groupOrder.get(bGroups[0]) ?? Infinity) : Infinity;
      if (aFirst !== bFirst) return aFirst - bFirst;
      return a.name.localeCompare(b.name);
    });

    // Place NPCs evenly around the circle
    const totalNodes = sorted.length;
    const angleStep = (2 * Math.PI) / totalNodes;

    const nodes: ChordNode[] = sorted.map((npc, i) => {
      const angle = -Math.PI / 2 + i * angleStep; // start from top
      return {
        id: npc.id,
        name: npc.name,
        status: npc.status,
        image: npc.image,
        groupIds: npcToGroups.get(npc.id) ?? [],
        angle,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    // Build angle lookup
    const angleMap = new Map(nodes.map((n) => [n.id, n.angle]));

    // Build group arc segments
    // Find the first and last node index for each group
    const groupSegments: ChordGroup[] = [];
    const groupsWithMembers = groups.filter((g) =>
      sorted.some((npc) => (npcToGroups.get(npc.id) ?? []).includes(g.id)),
    );

    for (let gi = 0; gi < groupsWithMembers.length; gi++) {
      const g = groupsWithMembers[gi];
      let firstIdx = -1;
      let lastIdx = -1;
      for (let i = 0; i < sorted.length; i++) {
        const gids = npcToGroups.get(sorted[i].id) ?? [];
        if (gids.includes(g.id)) {
          if (firstIdx === -1) firstIdx = i;
          lastIdx = i;
        }
      }
      if (firstIdx >= 0) {
        const arcGap = 0.03;
        const startAngle = -Math.PI / 2 + firstIdx * angleStep - angleStep * 0.35 + arcGap;
        const endAngle = -Math.PI / 2 + lastIdx * angleStep + angleStep * 0.35 - arcGap;
        groupSegments.push({
          id: g.id,
          name: g.name,
          colorIndex: gi % GROUP_HULL_COLORS.length,
          startAngle,
          endAngle,
          ring: 0,
        });
      }
    }

    // Detect overlapping arcs and push to outer ring
    for (let i = 0; i < groupSegments.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = groupSegments[j];
        const b = groupSegments[i];
        // Overlap if ranges intersect
        if (a.startAngle < b.endAngle && b.startAngle < a.endAngle && a.ring === b.ring) {
          b.ring = a.ring + 1;
        }
      }
    }

    // Filter to NPC-NPC relations where both exist
    const npcIdSet = new Set(npcs.map((n) => n.id));
    const validRelations = relations.filter(
      (r) =>
        r.fromEntity.type === 'npc' &&
        r.toEntity.type === 'npc' &&
        npcIdSet.has(r.fromEntity.id) &&
        npcIdSet.has(r.toEntity.id),
    );

    // Build chords
    const chords: Chord[] = validRelations.map((r) => ({
      id: r.id,
      sourceId: r.fromEntity.id,
      targetId: r.toEntity.id,
      friendliness: r.friendliness,
      note: r.note,
      sourceAngle: angleMap.get(r.fromEntity.id) ?? 0,
      targetAngle: angleMap.get(r.toEntity.id) ?? 0,
    }));

    return { nodes, chords, groups: groupSegments, cx, cy, radius };
  }, [npcs, groups, relations, width, height]);
}
