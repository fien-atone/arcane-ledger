import type { GraphNode } from '../lib/graphTypes';
import { STATUS_DOT_COLORS, STATUS_STROKE_COLORS } from '../lib/graphTypes';
import { resolveImageUrl } from '@/shared/api/imageUrl';

interface Props {
  node: GraphNode;
  dimmed?: boolean;
  highlighted?: boolean;
  onMouseEnter?: (nodeId: string) => void;
  onMouseLeave?: () => void;
  onClick?: (nodeId: string) => void;
}

const BASE_RADIUS = 26;

export function GraphNodeComponent({
  node,
  dimmed,
  highlighted,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: Props) {
  const r = BASE_RADIUS + Math.min(node.relationCount * 1.5, 10);
  const resolved = resolveImageUrl(node.image);
  const initials = node.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  const statusColor = STATUS_DOT_COLORS[node.status];
  const strokeColor = STATUS_STROKE_COLORS[node.status];
  const isDead = node.status === 'dead';
  const clipId = `clip-${node.id}`;

  const opacity = dimmed ? 0.15 : 1;
  const nameLabel = node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name;

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
      opacity={opacity}
      onMouseEnter={() => onMouseEnter?.(node.id)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick?.(node.id)}
    >
      {/* Highlight ring */}
      {highlighted && (
        <circle
          r={r + 4}
          fill="none"
          stroke="#f2ca50"
          strokeWidth={2}
          strokeOpacity={0.6}
        />
      )}

      {/* Avatar */}
      <defs>
        <clipPath id={clipId}>
          <circle r={r} />
        </clipPath>
      </defs>

      {resolved ? (
        <>
          <circle r={r} fill="#1e1e2e" />
          <image
            href={resolved}
            x={-r}
            y={-r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
        </>
      ) : (
        <>
          <circle r={r} fill="#2a2a3e" stroke="#3a3a52" strokeWidth={1.5} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#9ca3af"
            fontSize={r * 0.7}
            fontWeight={700}
            style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none' }}
          >
            {initials}
          </text>
        </>
      )}

      {/* Status border ring */}
      <circle r={r} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeOpacity={isDead ? 0.4 : 0.8} />

      {/* Status dot */}
      <circle
        cx={r * 0.65}
        cy={r * 0.65}
        r={4}
        fill={statusColor}
        stroke="#1e1e2e"
        strokeWidth={2}
      />

      {/* Name label with background */}
      <rect
        x={-nameLabel.length * 3.2}
        y={r + 6}
        width={nameLabel.length * 6.4}
        height={16}
        rx={3}
        fill="#12121c"
        fillOpacity={0.7}
      />
      <text
        y={r + 18}
        textAnchor="middle"
        fill="#e4e4e7"
        fontSize={12}
        fontWeight={600}
        style={{ fontFamily: 'Inter, sans-serif', userSelect: 'none' }}
      >
        {nameLabel}
      </text>
    </g>
  );
}
