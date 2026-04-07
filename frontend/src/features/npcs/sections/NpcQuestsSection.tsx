/**
 * Quests where this NPC is the giver. GM can toggle player visibility per quest.
 * Self-contained: fetches its own quest list.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuests, useSetQuestVisibility } from '@/features/quests/api';

interface Props {
  campaignId: string;
  npcId: string;
  isGm: boolean;
  enabled: boolean;
  partyEnabled: boolean;
}

const STATUS_DOT: Record<string, string> = {
  active: 'bg-secondary',
  completed: 'bg-emerald-400',
  failed: 'bg-rose-400',
  unavailable: 'bg-outline-variant',
  undiscovered: 'bg-on-surface-variant/20',
};

export function NpcQuestsSection({ campaignId, npcId, isGm, enabled, partyEnabled }: Props) {
  const { t } = useTranslation('npcs');
  const { data: allQuests } = useQuests(campaignId);
  const setQuestVisibility = useSetQuestVisibility();

  if (!enabled) return null;

  const npcQuests = (allQuests ?? [])
    .filter((q) => q.giverId === npcId)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (npcQuests.length === 0) return null;

  return (
    <section className="space-y-8 min-w-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
          {t('section_quests')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>
      <div className="space-y-2">
        {npcQuests.map((q) => (
          <div key={q.id} className="flex items-stretch bg-surface-container-low border border-outline-variant/10 rounded-sm overflow-hidden group/card">
            <Link
              to={`/campaigns/${campaignId}/quests/${q.id}`}
              className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[q.status] ?? 'bg-outline-variant'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{q.title}</p>
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 mt-0.5">
                  {q.status}
                </p>
              </div>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">
                arrow_forward
              </span>
            </Link>
            {isGm && partyEnabled && (
              <button
                onClick={() => setQuestVisibility.mutate({
                  campaignId,
                  id: q.id,
                  playerVisible: !q.playerVisible,
                  playerVisibleFields: q.playerVisibleFields ?? [],
                })}
                title={q.playerVisible ? t('visible_click_to_hide') : t('hidden_click_to_show')}
                className={`px-2 border-l border-outline-variant/10 transition-colors ${
                  q.playerVisible
                    ? 'text-primary/60 hover:text-primary'
                    : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {q.playerVisible ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
