import type { GraphEdge, GraphNode } from '../lib/graphTypes';
import { FRIENDLINESS_COLORS } from '../lib/graphTypes';
import { friendlinessLabel } from '@/entities/relation';

interface Props {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  dimmed?: boolean;
  highlighted?: boolean;
  /** Center of the graph for edge bundling */
  center?: { x: number; y: number };
  /** Bundling strength: 0 = straight lines, 1 = all through center. Default 0.6 */
  bundleStrength?: number;
  onMouseEnter?: (e: React.MouseEvent, edge: GraphEdge) => void;
  onMouseLeave?: () => void;
}

const NODE_RADIUS = 26;

export function GraphEdgeComponent({
  edge,
  sourceNode,
  targetNode,
  dimmed,
  highlighted,
  center,
  bundleStrength = 0.6,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const label = friendlinessLabel(edge.friendliness);
  const color = FRIENDLINESS_COLORS[label] || '#fbbf24';

  const sx = sourceNode.x;
  const sy = sourceNode.y;
  const tx = targetNode.x;
  const ty = targetNode.y;

  // Shorten line so it doesn't overlap with node circles
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const startX = sx + ux * NODE_RADIUS;
  const startY = sy + uy * NODE_RADIUS;
  const rawEndX = edge.isBidirectional ? tx - ux * NODE_RADIUS : tx - ux * (NODE_RADIUS + 6);
  const rawEndY = edge.isBidirectional ? ty - uy * NODE_RADIUS : ty - uy * (NODE_RADIUS + 6);

  const markerId = `arrow-${edge.id}`;

  let pathD: string;
  if (center) {
    // Edge bundling: control points pulled toward the graph center
    const midX = (startX + rawEndX) / 2;
    const midY = (startY + rawEndY) / 2;
    const cp1x = midX + (center.x - midX) * bundleStrength;
    const cp1y = midY + (center.y - midY) * bundleStrength;
    pathD = `M ${startX},${startY} Q ${cp1x},${cp1y} ${rawEndX},${rawEndY}`;
  } else {
    pathD = `M ${startX},${startY} L ${rawEndX},${rawEndY}`;
  }

  const opacity = dimmed ? 0.05 : highlighted ? 1 : 0.4;

  return (
    <g style={{ transition: 'opacity 0.2s' }}>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 6 6"
          refX={5}
          refY={3}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" fill={color} />
        </marker>
      </defs>
      {/* Invisible wider hit area for hover */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={14}
        fill="none"
        style={{ cursor: 'pointer' }}
        onMouseEnter={(e) => onMouseEnter?.(e, edge)}
        onMouseLeave={onMouseLeave}
      />
      <path
        d={pathD}
        stroke={color}
        strokeWidth={highlighted ? 2.5 : 1.5}
        fill="none"
        opacity={opacity}
        markerEnd={edge.isBidirectional ? undefined : `url(#${markerId})`}
        pointerEvents="none"
      />
    </g>
  );
}
