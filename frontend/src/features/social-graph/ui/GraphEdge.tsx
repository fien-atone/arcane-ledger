import type { GraphEdge, GraphNode } from '../lib/graphTypes';
import { FRIENDLINESS_COLORS } from '../lib/graphTypes';
import { friendlinessLabel } from '@/entities/relation';

interface Props {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  dimmed?: boolean;
  highlighted?: boolean;
  onMouseEnter?: (e: React.MouseEvent, edge: GraphEdge) => void;
  onMouseLeave?: () => void;
}

const NODE_RADIUS = 20;

export function GraphEdgeComponent({
  edge,
  sourceNode,
  targetNode,
  dimmed,
  highlighted,
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
  const endX = tx - ux * (NODE_RADIUS + 6); // leave room for arrowhead
  const endY = ty - uy * (NODE_RADIUS + 6);

  const markerId = `arrow-${edge.id}`;

  // Bidirectional: no arrowhead offset needed
  const adjustedEndX = edge.isBidirectional ? tx - ux * NODE_RADIUS : endX;
  const adjustedEndY = edge.isBidirectional ? ty - uy * NODE_RADIUS : endY;
  const pathD = `M ${startX},${startY} L ${adjustedEndX},${adjustedEndY}`;

  const opacity = dimmed ? 0.08 : highlighted ? 1 : 0.6;

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
        strokeWidth={2}
        fill="none"
        opacity={opacity}
        markerEnd={edge.isBidirectional ? undefined : `url(#${markerId})`}
        pointerEvents="none"
      />
    </g>
  );
}
