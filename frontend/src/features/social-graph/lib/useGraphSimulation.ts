import { useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import type { NPC } from '@/entities/npc';
import type { Relation } from '@/entities/relation';
import type { Group } from '@/entities/group';
import type { GraphNode, GraphEdge, GraphGroup } from './graphTypes';
import { GROUP_HULL_COLORS } from './graphTypes';
import { computeGroupCenters } from './computeGroupCenters';

interface SimNode extends SimulationNodeDatum {
  id: string;
  name: string;
  status: GraphNode['status'];
  image?: string;
  groupIds: string[];
  relationCount: number;
}
interface SimLink extends SimulationLinkDatum<SimNode> {
  edgeId: string;
}

interface SimulationResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  groups: GraphGroup[];
}

export function useGraphSimulation(
  npcs: NPC[],
  groups: Group[],
  relations: Relation[],
  width: number,
  height: number,
  layoutKey = 0,
): SimulationResult {
  return useMemo(() => {
    if (npcs.length === 0 || width === 0 || height === 0) {
      return { nodes: [], edges: [], groups: [] };
    }

    // Filter to NPC-NPC relations only
    const npcNpcRelations = relations.filter(
      (r) => r.fromEntity.type === 'npc' && r.toEntity.type === 'npc',
    );

    // Build NPC ID set for quick lookup
    const npcIdSet = new Set(npcs.map((n) => n.id));

    // Only keep relations where both NPCs exist in our list
    const validRelations = npcNpcRelations.filter(
      (r) => npcIdSet.has(r.fromEntity.id) && npcIdSet.has(r.toEntity.id),
    );

    // Count relations per NPC
    const relationCountMap = new Map<string, number>();
    for (const r of validRelations) {
      relationCountMap.set(r.fromEntity.id, (relationCountMap.get(r.fromEntity.id) || 0) + 1);
      relationCountMap.set(r.toEntity.id, (relationCountMap.get(r.toEntity.id) || 0) + 1);
    }

    // Build NPC-to-group mapping
    const npcToGroups = new Map<string, string[]>();
    for (const npc of npcs) {
      const memberGroupIds = (npc.groupMemberships ?? [])
        .map((m) => m.groupId)
        .filter((gid) => groups.some((g) => g.id === gid));
      npcToGroups.set(npc.id, memberGroupIds);
    }

    // Determine which groups have members
    const groupsWithMembers = groups.filter((g) =>
      npcs.some((n) => (npcToGroups.get(n.id) ?? []).includes(g.id)),
    );

    // Compute group cluster centers
    const groupCenters = computeGroupCenters(
      groupsWithMembers.map((g) => g.id),
      width,
      height,
    );

    // Simple seeded pseudo-random for stable layout
    let seed = 42;
    const seededRandom = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Create simulation nodes
    const simNodes: SimNode[] = npcs.map((npc) => {
      const gids = npcToGroups.get(npc.id) ?? [];
      // Starting position: near group center or center of viewport
      let startX = width / 2;
      let startY = height / 2;
      if (gids.length > 0) {
        const center = groupCenters.get(gids[0]);
        if (center) {
          startX = center.cx + (seededRandom() - 0.5) * 60;
          startY = center.cy + (seededRandom() - 0.5) * 60;
        }
      } else {
        startX += (seededRandom() - 0.5) * 100;
        startY += (seededRandom() - 0.5) * 100;
      }

      return {
        id: npc.id,
        name: npc.name,
        status: npc.status,
        image: npc.image,
        groupIds: gids,
        relationCount: relationCountMap.get(npc.id) || 0,
        x: startX,
        y: startY,
      };
    });

    // Create simulation links
    const simLinks: SimLink[] = validRelations.map((r) => ({
      source: r.fromEntity.id,
      target: r.toEntity.id,
      edgeId: r.id,
    }));

    // Merge bidirectional pairs into single edges
    const pairKey = (a: string, b: string) => [a, b].sort().join('::');
    const pairMap = new Map<string, { relations: typeof validRelations; ids: [string, string] }>();
    for (const r of validRelations) {
      const key = pairKey(r.fromEntity.id, r.toEntity.id);
      const existing = pairMap.get(key);
      if (existing) {
        existing.relations.push(r);
      } else {
        pairMap.set(key, { relations: [r], ids: [r.fromEntity.id, r.toEntity.id] });
      }
    }

    const edges: GraphEdge[] = [];
    for (const [, { relations: rels, ids }] of pairMap) {
      const isBidi = rels.length >= 2;
      const avgFriendliness = Math.round(rels.reduce((s, r) => s + r.friendliness, 0) / rels.length);
      const notes = rels.map((r) => r.note).filter(Boolean);
      edges.push({
        id: rels[0].id,
        sourceId: ids[0],
        targetId: ids[1],
        friendliness: avgFriendliness,
        note: notes.join(' / ') || undefined,
        isBidirectional: isBidi,
        curveDirection: 0,
      });
    }

    // Loners: NPC without groups and without relations
    const loners = simNodes.filter((n) => n.groupIds.length === 0 && n.relationCount === 0);
    const outerRadius = Math.min(width, height) * 0.45;
    const lonerPositions = new Map<string, { x: number; y: number }>();
    loners.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(loners.length, 1) - Math.PI / 2;
      lonerPositions.set(n.id, {
        x: width / 2 + outerRadius * Math.cos(angle),
        y: height / 2 + outerRadius * Math.sin(angle),
      });
    });

    // Run D3 force simulation
    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(200)
          .strength(0.3),
      )
      .force('charge', forceManyBody<SimNode>().strength(-300))
      .force('center', forceCenter(width / 2, height / 2).strength(0.03))
      .force('collide', forceCollide<SimNode>(65))
      .stop();

    // Groups on inner circle, loners on outer circle
    simulation.force(
      'groupX',
      forceX<SimNode>((d) => {
        if (d.groupIds.length > 0) {
          const center = groupCenters.get(d.groupIds[0]);
          if (center) return center.cx;
        }
        const lp = lonerPositions.get(d.id);
        if (lp) return lp.x;
        return width / 2;
      }).strength((d) => {
        if (d.groupIds.length > 0) return 0.3;
        if (lonerPositions.has(d.id)) return 0.25;
        return 0.02;
      }),
    );

    simulation.force(
      'groupY',
      forceY<SimNode>((d) => {
        if (d.groupIds.length > 0) {
          const center = groupCenters.get(d.groupIds[0]);
          if (center) return center.cy;
        }
        const lp = lonerPositions.get(d.id);
        if (lp) return lp.y;
        return height / 2;
      }).strength((d) => {
        if (d.groupIds.length > 0) return 0.3;
        if (lonerPositions.has(d.id)) return 0.25;
        return 0.02;
      }),
    );

    // Compute all ticks upfront (no animation)
    simulation.alpha(1).alphaDecay(0.02);
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }

    // Extract final positions
    const finalNodes: GraphNode[] = simNodes.map((n) => ({
      id: n.id,
      name: n.name,
      status: n.status,
      image: n.image,
      groupIds: n.groupIds,
      relationCount: n.relationCount,
      x: n.x ?? width / 2,
      y: n.y ?? height / 2,
    }));

    // Build graph groups
    const graphGroups: GraphGroup[] = groupsWithMembers.map((g, i) => {
      const memberIds = npcs
        .filter((npc) => (npcToGroups.get(npc.id) ?? []).includes(g.id))
        .map((npc) => npc.id);
      const center = groupCenters.get(g.id) ?? { cx: width / 2, cy: height / 2 };
      return {
        id: g.id,
        name: g.name,
        colorIndex: i % GROUP_HULL_COLORS.length,
        memberNodeIds: memberIds,
        cx: center.cx,
        cy: center.cy,
      };
    });

    return { nodes: finalNodes, edges, groups: graphGroups };
  }, [npcs, groups, relations, width, height, layoutKey]);
}
