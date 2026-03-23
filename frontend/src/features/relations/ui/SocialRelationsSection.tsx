import { Link } from 'react-router-dom';
import { useRelationsForEntity } from '../api';
import { useNpcs } from '@/features/npcs/api/queries';
import { useParty } from '@/features/characters/api/queries';
import { useGroups } from '@/features/groups/api';
import {
  friendlinessLabel,
  friendlinessColor,
  friendlinessBarColor,
} from '@/entities/relation';
import type { EntityRef } from '@/entities/relation';

interface Props {
  campaignId: string;
  entityId: string;
}

function FriendlinessBar({ score }: { score: number }) {
  const pct = Math.round(((score + 100) / 200) * 100);
  const barColor = friendlinessBarColor(score);
  const label = friendlinessLabel(score);
  const labelColor = friendlinessColor(score);
  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      <span className={`text-[10px] font-bold uppercase tracking-widest w-16 text-right ${labelColor}`}>
        {label}
      </span>
      <div className="w-24 h-1 bg-outline-variant/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-on-surface-variant/30 w-8 text-right tabular-nums">
        {score > 0 ? `+${score}` : score}
      </span>
    </div>
  );
}

export function SocialRelationsSection({ campaignId, entityId }: Props) {
  const { data: relations } = useRelationsForEntity(campaignId, entityId);
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: allChars } = useParty(campaignId);
  const { data: allGroups } = useGroups(campaignId);

  if (!relations || relations.length === 0) return null;

  function resolveName(ref: EntityRef): string {
    if (ref.type === 'npc') return allNpcs?.find((n) => n.id === ref.id)?.name ?? ref.id;
    if (ref.type === 'character') return allChars?.find((c) => c.id === ref.id)?.name ?? ref.id;
    if (ref.type === 'group') return allGroups?.find((g) => g.id === ref.id)?.name ?? ref.id;
    return ref.id;
  }

  function resolveLink(ref: EntityRef): string {
    if (ref.type === 'npc') return `/campaigns/${campaignId}/npcs/${ref.id}`;
    if (ref.type === 'character') return `/campaigns/${campaignId}/characters/${ref.id}`;
    if (ref.type === 'group') return `/campaigns/${campaignId}/groups/${ref.id}`;
    return '#';
  }

  function entityTypeIcon(ref: EntityRef): string {
    if (ref.type === 'npc') return 'person';
    if (ref.type === 'character') return 'shield_person';
    return 'groups';
  }

  const outgoing = relations.filter((r) => r.fromEntity.id === entityId);
  const incoming = relations.filter((r) => r.toEntity.id === entityId);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
          Social Relations
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>

      <div className="space-y-6">

        {/* Outgoing: how this entity feels about others */}
        {outgoing.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">
              Their perspective →
            </p>
            {outgoing.map((rel) => {
              const target = rel.toEntity;
              const name = resolveName(target);
              const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              return (
                <Link
                  key={rel.id}
                  to={resolveLink(target)}
                  className="flex items-center gap-4 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-on-surface-variant/60">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[12px] text-on-surface-variant/30">
                        {entityTypeIcon(target)}
                      </span>
                      <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {name}
                      </p>
                    </div>
                    {rel.note && (
                      <p className="text-[10px] text-on-surface-variant/40 italic mt-0.5 truncate">{rel.note}</p>
                    )}
                  </div>
                  <FriendlinessBar score={rel.friendliness} />
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Incoming: how others feel about this entity */}
        {incoming.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/40 font-bold">
              ← Others' perspective
            </p>
            {incoming.map((rel) => {
              const source = rel.fromEntity;
              const name = resolveName(source);
              const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              return (
                <Link
                  key={rel.id}
                  to={resolveLink(source)}
                  className="flex items-center gap-4 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-on-surface-variant/60">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[12px] text-on-surface-variant/30">
                        {entityTypeIcon(source)}
                      </span>
                      <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                        {name}
                      </p>
                    </div>
                    {rel.note && (
                      <p className="text-[10px] text-on-surface-variant/40 italic mt-0.5 truncate">{rel.note}</p>
                    )}
                  </div>
                  <FriendlinessBar score={rel.friendliness} />
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
