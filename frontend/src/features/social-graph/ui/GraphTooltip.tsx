import { useTranslation } from 'react-i18next';
import type { GraphEdge, GraphNode } from '../lib/graphTypes';
import { FRIENDLINESS_COLORS } from '../lib/graphTypes';
import { friendlinessLabel } from '@/entities/relation';

interface Props {
  edge: GraphEdge;
  sourceNode: GraphNode;
  targetNode: GraphNode;
  x: number;
  y: number;
}

const ATTITUDE_KEYS: Record<string, string> = {
  Hostile: 'attitude_hostile',
  Unfriendly: 'attitude_unfriendly',
  Neutral: 'attitude_neutral',
  Friendly: 'attitude_friendly',
  Allied: 'attitude_allied',
};

export function GraphTooltip({ edge, sourceNode, targetNode, x, y }: Props) {
  const { t } = useTranslation('social');
  const label = friendlinessLabel(edge.friendliness);
  const color = FRIENDLINESS_COLORS[label] || '#fbbf24';
  const noteText =
    edge.note && edge.note.length > 80
      ? edge.note.slice(0, 77) + '...'
      : edge.note;

  const arrow = edge.isBidirectional ? '\u2194' : '\u2192';

  return (
    <div
      className="absolute z-50 pointer-events-none px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-sm shadow-xl max-w-[260px]"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -100%) translateY(-12px)',
      }}
    >
      <p className="text-xs text-on-surface font-medium whitespace-nowrap">
        {sourceNode.name}
        <span className="text-on-surface-variant/40 mx-1">{arrow}</span>
        {targetNode.name}
      </p>
      <p className="text-[11px] font-semibold mt-0.5" style={{ color }}>
        {t(ATTITUDE_KEYS[label] || 'attitude_neutral')}
      </p>
      {noteText && (
        <p className="text-[10px] text-on-surface-variant/60 mt-1 leading-snug">
          {noteText}
        </p>
      )}
    </div>
  );
}
