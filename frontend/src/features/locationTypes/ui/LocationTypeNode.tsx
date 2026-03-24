import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { LocationTypeEntry, LocationTypeCategory } from '@/entities/locationType';

export interface LocationTypeNodeData extends Record<string, unknown> {
  entry: LocationTypeEntry;
  selected: boolean;
}

const CATEGORY_STYLES: Record<LocationTypeCategory, { ring: string; bg: string; text: string; dot: string }> = {
  world:      { ring: 'border-indigo-400/60',  bg: 'bg-indigo-950/80',  text: 'text-indigo-200',  dot: 'bg-indigo-400' },
  geographic: { ring: 'border-emerald-400/60', bg: 'bg-emerald-950/80', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  water:      { ring: 'border-sky-400/60',     bg: 'bg-sky-950/80',     text: 'text-sky-200',     dot: 'bg-sky-400' },
  civilization: { ring: 'border-amber-400/60',  bg: 'bg-amber-950/80',   text: 'text-amber-200',   dot: 'bg-amber-400' },
  poi:        { ring: 'border-rose-400/60',    bg: 'bg-rose-950/80',    text: 'text-rose-200',    dot: 'bg-rose-400' },
  travel:     { ring: 'border-violet-400/60',  bg: 'bg-violet-950/80',  text: 'text-violet-200',  dot: 'bg-violet-400' },
};

export const LocationTypeNode = memo(({ data }: NodeProps) => {
  const nodeData = data as LocationTypeNodeData;
  const { entry, selected } = nodeData;
  const style = CATEGORY_STYLES[entry.category];

  return (
    <div
      className={`
        relative flex flex-col items-center gap-1.5 px-4 py-3 rounded-sm border
        ${style.bg} ${style.ring}
        ${selected ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : ''}
        shadow-lg min-w-[100px] cursor-pointer transition-all
      `}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !border-2 !border-surface !bg-on-surface-variant"
      />

      {/* Icon + dot */}
      <div className="relative">
        <span
          className={`material-symbols-outlined text-[22px] ${style.text}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {entry.icon}
        </span>
        <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${style.dot}`} />
      </div>

      {/* Name */}
      <span className={`text-[10px] font-label uppercase tracking-widest ${style.text} text-center leading-tight`}>
        {entry.name}
      </span>

      {/* Builtin badge */}
      {entry.builtin && (
        <span className="text-[8px] text-on-surface-variant/30 uppercase tracking-wider">built-in</span>
      )}

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border-2 !border-surface !bg-on-surface-variant"
      />

      {/* Left/right handles for connection edges */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !border-2 !border-surface !bg-primary/60"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !border-2 !border-surface !bg-primary/60"
      />
    </div>
  );
});

LocationTypeNode.displayName = 'LocationTypeNode';
