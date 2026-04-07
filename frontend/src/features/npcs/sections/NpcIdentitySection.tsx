/**
 * NPC identity pills — status, gender, age, species link, and aliases.
 * Composed inside NpcHeroSection (renders inline within the hero card,
 * so the visual layout stays identical to the original).
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSpecies } from '@/features/species/api';
import type { NPC, NpcStatus } from '@/entities/npc';

interface Props {
  campaignId: string;
  npc: NPC;
  speciesEnabled: boolean;
}

const STATUS_STYLES: Record<NpcStatus, { pill: string }> = {
  alive:   { pill: 'bg-primary/10 text-primary border border-primary/20' },
  dead:    { pill: 'bg-surface-container-highest text-on-surface-variant/40 border border-outline-variant/20' },
  missing: { pill: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/20' },
  unknown: { pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10' },
};

export function NpcIdentityPills({ campaignId, npc, speciesEnabled }: Props) {
  const { t } = useTranslation('npcs');
  const { data: allSpecies } = useSpecies(campaignId);
  const st = STATUS_STYLES[npc.status];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm ${st.pill}`}>
        {t(`status_${npc.status}`)}
      </span>
      {npc.gender && (
        <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
          {t(`gender_${npc.gender}`)}
        </span>
      )}
      {npc.age != null && (
        <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
          {t('age_prefix')} {npc.age}
        </span>
      )}
      {speciesEnabled && npc.species && (() => {
        const matchedSpecies = allSpecies?.find(
          (s) => s.id === npc.speciesId || s.name.toLowerCase() === npc.species?.toLowerCase()
        );
        const displayName = matchedSpecies?.name ?? npc.species;
        return matchedSpecies ? (
          <Link
            to={`/campaigns/${campaignId}/species/${matchedSpecies.id}`}
            className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10 hover:border-primary/30 hover:text-primary transition-colors"
          >
            {displayName}
          </Link>
        ) : (
          <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[10px] font-label tracking-widest uppercase rounded-sm border border-outline-variant/10">
            {displayName}
          </span>
        );
      })()}
    </div>
  );
}

export function NpcAliasList({ npc }: { npc: NPC }) {
  if (npc.aliases.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {npc.aliases.map((alias) => (
        <span key={alias} className="text-xs text-on-surface-variant bg-surface-container px-3 py-1 border border-outline-variant/20 italic">
          "{alias}"
        </span>
      ))}
    </div>
  );
}
