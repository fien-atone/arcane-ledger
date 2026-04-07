/**
 * NPC relations — direct typed relations (sibling/parent/etc.) plus the
 * generic SocialRelationsSection (GM only).
 *
 * Self-contained: fetches the campaign's NPC list itself to resolve relation targets.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNpcs } from '@/features/npcs/api/queries';
import { SocialRelationsSection } from '@/features/relations/ui';
import type { NPC, NpcRelationType } from '@/entities/npc';

interface Props {
  campaignId: string;
  npc: NPC;
  isGm: boolean;
}

export function NpcRelationsSection({ campaignId, npc, isGm }: Props) {
  const { t } = useTranslation('npcs');
  const { data: allNpcs } = useNpcs(campaignId);

  const RELATION_CONFIG: Record<NpcRelationType, { label: string; icon: string }> = {
    sibling:      { label: t('relation_sibling'),      icon: 'people' },
    parent:       { label: t('relation_parent'),       icon: 'person' },
    child:        { label: t('relation_child'),        icon: 'child_care' },
    spouse:       { label: t('relation_spouse'),       icon: 'favorite' },
    mentor:       { label: t('relation_mentor'),       icon: 'school' },
    pupil:        { label: t('relation_pupil'),        icon: 'auto_stories' },
    ally:         { label: t('relation_ally'),         icon: 'handshake' },
    rival:        { label: t('relation_rival'),        icon: 'sports_kabaddi' },
    acquaintance: { label: t('relation_acquaintance'), icon: 'link' },
  };

  const resolvedRelations = (npc.relations ?? [])
    .map((rel) => ({ rel, other: allNpcs?.find((n) => n.id === rel.npcId) }))
    .filter((r): r is { rel: typeof r.rel; other: NonNullable<typeof r.other> } => !!r.other);

  return (
    <>
      {resolvedRelations.length > 0 && (
        <section className="space-y-8 min-w-0">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
              {t('section_relations')}
            </h2>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <div className="space-y-2">
            {resolvedRelations.map(({ rel, other }) => {
              const rc = RELATION_CONFIG[rel.type];
              const initials = other.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              return (
                <Link
                  key={`${rel.npcId}-${rel.type}`}
                  to={`/campaigns/${campaignId}/npcs/${other.id}`}
                  className="flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-sm bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-on-surface-variant/60">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                      {other.name}
                    </p>
                    {rel.note && (
                      <p className="text-[10px] text-on-surface-variant/50 italic">{rel.note}</p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-surface-container rounded-full text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border border-outline-variant/10">
                    <span className="material-symbols-outlined text-[12px]">{rc.icon}</span>
                    {rc.label}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {isGm && <SocialRelationsSection campaignId={campaignId} entityId={npc.id} />}
    </>
  );
}
