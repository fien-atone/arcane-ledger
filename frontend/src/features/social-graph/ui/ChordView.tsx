import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { select } from 'd3-selection';
import 'd3-transition';
import { zoom, type ZoomBehavior } from 'd3-zoom';
import { useChordLayout } from '../lib/useChordLayout';
import { GROUP_HULL_COLORS, FRIENDLINESS_COLORS, STATUS_STROKE_COLORS } from '../lib/graphTypes';
import { GraphTooltip } from './GraphTooltip';
import type { GraphEdge } from '../lib/graphTypes';
import type { NPC } from '@/entities/npc';
import type { Relation } from '@/entities/relation';
import type { Group } from '@/entities/group';
import { friendlinessLabel } from '@/entities/relation';
import { resolveImageUrl } from '@/shared/api/imageUrl';

interface Props {
  npcs: NPC[];
  groups: Group[];
  relations: Relation[];
  width: number;
  height: number;
  onNodeClick?: (nodeId: string) => void;
}

const NODE_RADIUS = 16;
const OUTER_RING_WIDTH = 18;
const LABEL_GAP = 8; // gap between group arc and NPC name labels

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const diff = Math.abs(endAngle - startAngle);
  const largeArc = diff > Math.PI && diff < Math.PI * 2 ? 1 : 0;
  // sweep=1 for clockwise
  const sweep = endAngle > startAngle ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
}

export function ChordView({ npcs, groups, relations, width, height, onNodeClick }: Props) {
  const { nodes, chords, groups: chordGroups, cx, cy, radius } = useChordLayout(
    npcs,
    groups,
    relations,
    width,
    height,
  );

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredChordId, setHoveredChordId] = useState<string | null>(null);
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);
  const [tooltipEdge, setTooltipEdge] = useState<{
    edge: GraphEdge;
    x: number;
    y: number;
  } | null>(null);

  // Group arc between nodes and names, equal gap on both sides
  const outerRingRadius = radius + NODE_RADIUS + LABEL_GAP + OUTER_RING_WIDTH / 2;
  // NPC names outside the group arc
  const labelRadius = outerRingRadius + OUTER_RING_WIDTH / 2 + LABEL_GAP;

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Set up zoom/pan (once on mount)
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        select(g).attr('transform', event.transform.toString());
      });

    select(svg).call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);


  // Node lookup
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  // Connected nodes/chords for hover highlighting
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>([hoveredNodeId]);
    for (const chord of chords) {
      if (chord.sourceId === hoveredNodeId) ids.add(chord.targetId);
      if (chord.targetId === hoveredNodeId) ids.add(chord.sourceId);
    }
    return ids;
  }, [hoveredNodeId, chords]);

  // Members of hovered group
  const hoveredGroupMemberIds = useMemo(() => {
    if (!hoveredGroupId) return new Set<string>();
    return new Set(
      nodes.filter((n) => n.groupIds.includes(hoveredGroupId)).map((n) => n.id),
    );
  }, [hoveredGroupId, nodes]);

  const connectedChordIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const ids = new Set<string>();
    for (const chord of chords) {
      if (chord.sourceId === hoveredNodeId || chord.targetId === hoveredNodeId) {
        ids.add(chord.id);
      }
    }
    return ids;
  }, [hoveredNodeId, chords]);

  const handleChordHover = useCallback(
    (e: React.MouseEvent, chord: typeof chords[number]) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setHoveredChordId(chord.id);
      setTooltipEdge({
        edge: {
          id: chord.id,
          sourceId: chord.sourceId,
          targetId: chord.targetId,
          friendliness: chord.friendliness,
          note: chord.note,
          isBidirectional: false,
          curveDirection: 0,
        },
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleChordLeave = useCallback(() => {
    setHoveredChordId(null);
    setTooltipEdge(null);
  }, []);

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ background: '#12121c' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id="chord-grid"
            width={40}
            height={40}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#1e1e2e"
              strokeWidth={0.5}
            />
          </pattern>
          {/* Clip paths for node avatars */}
          {nodes.map((node) => (
            <clipPath key={`clip-chord-${node.id}`} id={`clip-chord-${node.id}`}>
              <circle cx={node.x} cy={node.y} r={NODE_RADIUS - 1} />
            </clipPath>
          ))}
        </defs>
        <rect width="100%" height="100%" fill="url(#chord-grid)" />

        <g ref={gRef}>
          {/* Group arcs on outer ring with text along path */}
          {chordGroups.map((group) => {
            const color = GROUP_HULL_COLORS[group.colorIndex] || GROUP_HULL_COLORS[0];
            const ringOffset = group.ring * (OUTER_RING_WIDTH + 4);
            const ringR = outerRingRadius + ringOffset;
            const arcPath = describeArc(cx, cy, ringR, group.startAngle, group.endAngle);

            const isGroupHovered = hoveredGroupId === group.id;

            return (
              <g
                key={group.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredGroupId(group.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
              >
                <path
                  d={arcPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isGroupHovered ? OUTER_RING_WIDTH + 4 : OUTER_RING_WIDTH}
                  strokeLinecap="round"
                  opacity={isGroupHovered ? 1 : 0.7}
                  style={{ transition: 'stroke-width 0.15s, opacity 0.15s' }}
                />
              </g>
            );
          })}

          {/* Chords (inner arcs) */}
          {chords.map((chord) => {
            const src = nodeMap.get(chord.sourceId);
            const tgt = nodeMap.get(chord.targetId);
            if (!src || !tgt) return null;

            const label = friendlinessLabel(chord.friendliness);
            const color = FRIENDLINESS_COLORS[label] || '#fbbf24';

            const isNodeHovered = !!hoveredNodeId;
            const isGroupHov = !!hoveredGroupId;
            const isConnected = connectedChordIds.has(chord.id);
            const isChordHovered = hoveredChordId === chord.id;
            const bothInGroup = isGroupHov && hoveredGroupMemberIds.has(chord.sourceId) && hoveredGroupMemberIds.has(chord.targetId);
            const opacity = isChordHovered
              ? 1
              : isGroupHov
                ? bothInGroup ? 0.8 : 0.04
                : isNodeHovered
                  ? isConnected
                    ? 0.8
                    : 0.06
                  : 0.4;

            // Quadratic bezier through a point pulled toward center
            // Pull factor: 0 = straight to center, 1 = straight line
            const pull = 0.2;
            const ctrlX = cx + (src.x + tgt.x - 2 * cx) * pull / 2;
            const ctrlY = cy + (src.y + tgt.y - 2 * cy) * pull / 2;

            const d = `M ${src.x} ${src.y} Q ${ctrlX} ${ctrlY} ${tgt.x} ${tgt.y}`;

            return (
              <path
                key={chord.id}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={isChordHovered ? 2.5 : 1.5}
                opacity={opacity}
                style={{ transition: 'opacity 0.2s, stroke-width 0.15s', cursor: 'pointer' }}
                onMouseEnter={(e) => handleChordHover(e, chord)}
                onMouseMove={(e) => handleChordHover(e, chord)}
                onMouseLeave={handleChordLeave}
              />
            );
          })}

          {/* Nodes on the circle */}
          {nodes.map((node) => {
            const resolved = resolveImageUrl(node.image);
            const initials = node.name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0] || '')
              .join('')
              .toUpperCase();

            const strokeColor = STATUS_STROKE_COLORS[node.status];
            const isNodeHovered = !!hoveredNodeId;
            const isGroupHov = !!hoveredGroupId;
            const isConnected = connectedNodeIds.has(node.id);
            const isGroupMember = hoveredGroupMemberIds.has(node.id);
            const isThis = hoveredNodeId === node.id;
            const opacity = isGroupHov
              ? (isGroupMember ? 1 : 0.12)
              : isNodeHovered
                ? (isConnected ? 1 : 0.2)
                : 1;

            // Label position outside the circle
            const labelDist = labelRadius;
            const lx = cx + labelDist * Math.cos(node.angle);
            const ly = cy + labelDist * Math.sin(node.angle);
            const angleDeg = (node.angle * 180) / Math.PI;
            const flip = node.angle > Math.PI / 2 || node.angle < -Math.PI / 2;
            const textRotation = flip ? angleDeg + 180 : angleDeg;
            const anchor = flip ? 'end' : 'start';

            const nameLabel = node.name.length > 20 ? node.name.slice(0, 18) + '...' : node.name;

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                opacity={opacity}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => onNodeClick?.(node.id)}
              >
                {/* Highlight ring */}
                {isThis && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 3}
                    fill="none"
                    stroke="#f2ca50"
                    strokeWidth={2}
                    strokeOpacity={0.6}
                  />
                )}

                {/* Avatar / initials */}
                {resolved ? (
                  <>
                    <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill="#1e1e2e" />
                    <image
                      href={resolved}
                      x={node.x - NODE_RADIUS}
                      y={node.y - NODE_RADIUS}
                      width={NODE_RADIUS * 2}
                      height={NODE_RADIUS * 2}
                      clipPath={`url(#clip-chord-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <>
                    <circle cx={node.x} cy={node.y} r={NODE_RADIUS} fill="#2a2a3e" stroke="#3a3a52" strokeWidth={1} />
                    <text
                      x={node.x}
                      y={node.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#9ca3af"
                      fontSize={NODE_RADIUS * 0.75}
                      fontWeight={700}
                      style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none' }}
                    >
                      {initials}
                    </text>
                  </>
                )}

                {/* Status border ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={2}
                  strokeOpacity={node.status === 'dead' ? 0.4 : 0.8}
                />

                {/* Name label, rotated along circle tangent */}
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fill="#e4e4e7"
                  fontSize={10}
                  fontWeight={500}
                  transform={`rotate(${textRotation}, ${lx}, ${ly})`}
                  style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none' }}
                >
                  {nameLabel}
                </text>
              </g>
            );
          })}

          {/* Group name label in center on hover */}
          {hoveredGroupId && (() => {
            const hg = chordGroups.find((g) => g.id === hoveredGroupId);
            if (!hg) return null;
            const color = GROUP_HULL_COLORS[hg.colorIndex] || GROUP_HULL_COLORS[0];
            return (
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill={color}
                fontSize={16}
                fontWeight={700}
                letterSpacing="0.15em"
                style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none', textTransform: 'uppercase', pointerEvents: 'none' }}
              >
                {hg.name}
              </text>
            );
          })()}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltipEdge && nodeMap.get(tooltipEdge.edge.sourceId) && nodeMap.get(tooltipEdge.edge.targetId) && (
        <GraphTooltip
          edge={tooltipEdge.edge}
          sourceNode={{
            ...nodeMap.get(tooltipEdge.edge.sourceId)!,
            relationCount: 0,
          }}
          targetNode={{
            ...nodeMap.get(tooltipEdge.edge.targetId)!,
            relationCount: 0,
          }}
          x={tooltipEdge.x}
          y={tooltipEdge.y}
        />
      )}
    </>
  );
}
