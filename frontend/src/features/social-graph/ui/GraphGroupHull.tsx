import { useMemo } from 'react';
import type { GraphGroup, GraphNode } from '../lib/graphTypes';
import { getGroupColor, PARTY_GROUP_COLOR } from '../lib/graphTypes';

interface Props {
  group: GraphGroup;
  nodes: GraphNode[];
  dimmed?: boolean;
}

const MIN_RADIUS = 60;
const PADDING = 55;

export function GraphGroupHull({ group, nodes, dimmed }: Props) {
  const memberNodes = useMemo(
    () => nodes.filter((n) => group.memberNodeIds.includes(n.id)),
    [nodes, group.memberNodeIds],
  );

  const circle = useMemo(() => {
    if (memberNodes.length === 0) return null;

    const cx = memberNodes.reduce((s, n) => s + n.x, 0) / memberNodes.length;
    const cy = memberNodes.reduce((s, n) => s + n.y, 0) / memberNodes.length;

    // Smallest enclosing circle: max distance from centroid + padding
    const maxDist = memberNodes.length === 1
      ? 0
      : Math.max(...memberNodes.map((n) => Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2)));

    const r = Math.max(maxDist + PADDING, MIN_RADIUS);

    return { cx, cy, r };
  }, [memberNodes]);

  if (!circle || memberNodes.length === 0) return null;

  const color = group.colorIndex === -1 ? PARTY_GROUP_COLOR : getGroupColor(group.colorIndex);

  return (
    <g opacity={dimmed ? 0.05 : 1} style={{ transition: 'opacity 0.2s' }}>
      <circle
        cx={circle.cx}
        cy={circle.cy}
        r={circle.r}
        fill={color}
        fillOpacity={0.06}
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />
      <text
        x={circle.cx}
        y={circle.cy - circle.r - 8}
        textAnchor="middle"
        fill={color}
        fillOpacity={0.6}
        fontSize={10}
        fontWeight={700}
        letterSpacing="0.15em"
        style={{ textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}
      >
        {group.name}
      </text>
    </g>
  );
}
