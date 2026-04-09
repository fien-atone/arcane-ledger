/**
 * QuestGiverSection — linked NPC giver summary card.
 *
 * Gated on the NPCs module being enabled. Reads the giver from the quest
 * payload (the GraphQL query already hydrates giver). Shows an empty-state
 * message when no giver is linked.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { Quest } from '@/entities/quest';

interface Props {
  campaignId: string;
  quest: Quest;
  npcsEnabled: boolean;
}

export function QuestGiverSection({ campaignId, quest, npcsEnabled }: Props) {
  const { t } = useTranslation('quests');
  if (!npcsEnabled) return null;

  const giver = quest.giver;

  return (
    <SectionPanel title={t('section_quest_giver')}>
      {giver ? (
        <Link
          to={`/campaigns/${campaignId}/npcs/${giver.id}`}
          className="group flex items-center gap-3 p-3 bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 transition-colors"
        >
          <div className="w-9 h-9 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0">
            {giver.image ? (
              <img src={resolveImageUrl(giver.image)} alt={giver.name} className="w-full h-full object-cover rounded-sm" />
            ) : (
              <span className="text-xs font-bold text-on-surface-variant/60">
                {giver.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{giver.name}</p>
            {giver.species && (
              <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-wider">{giver.species}</p>
            )}
          </div>
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
        </Link>
      ) : (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_quest_giver')}</p>
      )}
    </SectionPanel>
  );
}
