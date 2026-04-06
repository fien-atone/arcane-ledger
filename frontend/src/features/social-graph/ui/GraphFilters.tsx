import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { NpcStatus } from '@/entities/npc';
import type { Group } from '@/entities/group';
import type { GroupTypeEntry } from '@/entities/groupType';
import { STATUS_STROKE_COLORS, getGroupColor, PARTY_GROUP_COLOR } from '../lib/graphTypes';

interface Props {
  statusFilters: Set<NpcStatus>;
  onToggleStatus: (status: NpcStatus) => void;
  groups: Group[];
  groupFilters: Set<string>;
  onToggleGroup: (groupId: string) => void;
  groupColorMap: Map<string, number>;
  groupTypes: GroupTypeEntry[];
}

const STATUS_KEYS: NpcStatus[] = ['alive', 'dead', 'missing', 'unknown'];

export function GraphFilters({
  statusFilters,
  onToggleStatus,
  groups,
  groupFilters,
  onToggleGroup,
  groupColorMap,
  groupTypes,
}: Props) {
  const { t } = useTranslation('social');

  // Group groups by type
  const typeToGroups = useMemo(() => {
    const map = new Map<string, Group[]>();
    for (const g of groups) {
      const list = map.get(g.type) || [];
      list.push(g);
      map.set(g.type, list);
    }
    return map;
  }, [groups]);

  // Which types have all their groups active?
  const activeTypes = useMemo(() => {
    const set = new Set<string>();
    for (const [typeId, typeGroups] of typeToGroups) {
      if (typeGroups.every((g) => groupFilters.has(g.id))) {
        set.add(typeId);
      }
    }
    return set;
  }, [typeToGroups, groupFilters]);

  const handleToggleType = (typeId: string) => {
    const typeGroups = typeToGroups.get(typeId) ?? [];
    const allActive = typeGroups.every((g) => groupFilters.has(g.id));
    for (const g of typeGroups) {
      if (allActive) {
        // Turn off all groups of this type (only if other groups remain active)
        if (groupFilters.has(g.id)) onToggleGroup(g.id);
      } else {
        // Turn on all groups of this type
        if (!groupFilters.has(g.id)) onToggleGroup(g.id);
      }
    }
  };

  const typesWithGroups = groupTypes.filter((gt) => typeToGroups.has(gt.id));

  return (
    <div className="absolute top-4 left-4 bg-surface-container/95 backdrop-blur-sm rounded-sm border border-outline-variant/20 shadow-lg p-3 max-w-[240px] max-h-[calc(100%-2rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-outline-variant/30">
      <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-1.5">
        {t('filter_status')}
      </p>
      <div className="flex flex-wrap gap-1">
        {STATUS_KEYS.map((value) => {
          const active = statusFilters.has(value);
          const color = STATUS_STROKE_COLORS[value];
          return (
            <button
              key={value}
              onClick={() => onToggleStatus(value)}
              className={`flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all ${
                active ? 'text-on-surface' : 'text-on-surface-variant/30'
              }`}
              style={active ? { backgroundColor: `${color}20`, border: `1px solid ${color}50` } : { backgroundColor: 'transparent', border: '1px solid transparent' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, opacity: active ? 1 : 0.3 }} />
              {t(`status_${value}`)}
            </button>
          );
        })}
      </div>

      {typesWithGroups.length > 0 && (
        <>
          <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-1.5 mt-3">
            {t('filter_group_types')}
          </p>
          <div className="flex flex-wrap gap-1">
            {typesWithGroups.map((gt) => {
              const active = activeTypes.has(gt.id);
              return (
                <button
                  key={gt.id}
                  onClick={() => handleToggleType(gt.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all ${
                    active ? 'bg-primary/15 text-primary border border-primary/30' : 'text-on-surface-variant/30 border border-transparent'
                  }`}
                >
                  {gt.icon && <span className="material-symbols-outlined text-[11px] leading-none">{gt.icon}</span>}
                  {gt.name}
                </button>
              );
            })}
          </div>
        </>
      )}

      {groups.length > 0 && (
        <>
          <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-1.5 mt-3">
            {t('filter_groups')}
          </p>
          <div className="flex flex-wrap gap-1">
            {[...groups].sort((a, b) => a.name.localeCompare(b.name)).map((g) => {
              const active = groupFilters.has(g.id);
              const colorIdx = groupColorMap.get(g.id) ?? 0;
              const color = colorIdx === -1 ? PARTY_GROUP_COLOR : getGroupColor(colorIdx);
              return (
                <button
                  key={g.id}
                  onClick={() => onToggleGroup(g.id)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full transition-all ${
                    active ? 'text-on-surface' : 'text-on-surface-variant/30'
                  }`}
                  style={active ? { backgroundColor: `${color}20`, border: `1px solid ${color}50` } : { backgroundColor: 'transparent', border: '1px solid transparent' }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, opacity: active ? 1 : 0.3 }} />
                  {g.name}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
