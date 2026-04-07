/**
 * Marker rendering constants shared by the map components.
 *
 * Moved verbatim from the legacy LocationDetailPage. The category-keyed colour
 * map is used by both the full MapViewer and the inline placeholder/mini-map.
 */
import type { LocationTypeEntry } from '@/entities/locationType';

export type TypeMap = Map<string, LocationTypeEntry>;

export const CATEGORY_MARKER_CLS: Record<string, { bubble: string; icon: string }> = {
  world:        { bubble: 'bg-indigo-950/80 border-indigo-400',  icon: 'text-indigo-300' },
  civilization: { bubble: 'bg-amber-950/80 border-amber-400',    icon: 'text-amber-300' },
  geographic:   { bubble: 'bg-emerald-950/80 border-emerald-400', icon: 'text-emerald-300' },
  water:        { bubble: 'bg-sky-950/80 border-sky-400',        icon: 'text-sky-300' },
  poi:          { bubble: 'bg-rose-950/80 border-rose-400',      icon: 'text-rose-300' },
  travel:       { bubble: 'bg-violet-950/80 border-violet-400',  icon: 'text-violet-300' },
};

export const MARKER_DEFAULT_CLS = { bubble: 'bg-surface-container border-primary', icon: 'text-primary' };

export const CATEGORY_ORDER = ['world', 'geographic', 'water', 'civilization', 'poi', 'travel'];
