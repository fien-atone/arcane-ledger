/**
 * SessionQuestsSection — list of quests advanced/touched in this session.
 *
 * Mirrors the NPC and Location sections: GM-only add picker with status
 * pill icons, inline-confirm remove, and (when the party module is on)
 * per-row visibility toggle.
 *
 * Status pill mapping is local to this section because no other section
 * shares the same colour-on-surface combinations.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuests, useSetQuestVisibility } from '@/features/quests/api';
import { useSaveSession } from '@/features/sessions/api/queries';
import { SectionPanel, InlineConfirm } from '@/shared/ui';
import { useLinkedEntityList } from '@/shared/hooks';
import type { Session } from '@/entities/session';
import type { QuestStatus } from '@/entities/quest';

const QUEST_STATUS_PILL: Record<QuestStatus, { cls: string; icon: string; iconColor: string }> = {
  active:      { cls: 'bg-secondary/10 text-secondary border-secondary/20', icon: 'bolt',           iconColor: 'text-secondary' },
  completed:   { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: 'check_circle',   iconColor: 'text-emerald-400' },
  failed:      { cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: 'cancel',         iconColor: 'text-rose-400' },
  unavailable: { cls: 'bg-surface-container-highest text-on-surface-variant/50 border-outline-variant/20', icon: 'block',          iconColor: 'text-on-surface-variant/40' },
  undiscovered: { cls: 'bg-surface-variant text-on-surface-variant border-outline-variant/10', icon: 'visibility_off', iconColor: 'text-on-surface-variant/30' },
};

interface Props {
  campaignId: string;
  session: Session;
  isGm: boolean;
  partyEnabled: boolean;
}

export function SessionQuestsSection({ campaignId, session, isGm, partyEnabled }: Props) {
  const { t } = useTranslation('sessions');
  const { data: allQuests } = useQuests(campaignId);
  const saveSession = useSaveSession(campaignId);
  const setQuestVisibility = useSetQuestVisibility();

  const questIds = session.questIds ?? [];
  const linked = [...(session.quests ?? [])].sort((a, b) => a.title.localeCompare(b.title));

  const picker = useLinkedEntityList({
    linked,
    candidates: allQuests ?? [],
    getCandidateId: (q) => q.id,
    getCandidateSearchText: (q) => q.title,
  });
  const available = [...picker.availableFiltered].sort((a, b) => a.title.localeCompare(b.title));

  const addQuest = async (id: string) => {
    await saveSession.mutate({ ...session, questIds: [...questIds, id] }, { only: 'questIds' });
    picker.closePicker();
  };
  const removeQuest = async (id: string) => {
    await saveSession.mutate({ ...session, questIds: questIds.filter((x) => x !== id) }, { only: 'questIds' });
    picker.cancelRemove();
  };

  return (
    <SectionPanel
      title={t('section_quests')}
      action={isGm ? (
        <button
          onClick={() => (picker.pickerOpen ? picker.closePicker() : picker.openPicker())}
          className="flex items-center gap-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 hover:border-primary/30 text-on-surface-variant hover:text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all"
        >
          <span className="material-symbols-outlined text-[13px]">add_task</span>
          {t('add')}
        </button>
      ) : undefined}
    >
      {isGm && picker.pickerOpen && (
        <div className="border border-outline-variant/20 bg-surface-container-low mb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[14px]">search</span>
            <input autoFocus type="text" placeholder={t('search_quests')}
              value={picker.search} onChange={(e) => picker.setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-transparent border-b border-outline-variant/20 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {available.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 italic px-4 py-3">{t('no_quests_found')}</p>
            ) : available.map((q) => (
              <button key={q.id} onClick={() => addQuest(q.id)}
                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-surface-container transition-colors">
                <span className={`material-symbols-outlined text-[14px] ${QUEST_STATUS_PILL[q.status?.toLowerCase() as QuestStatus]?.iconColor ?? 'text-on-surface-variant/40'}`}>{QUEST_STATUS_PILL[q.status?.toLowerCase() as QuestStatus]?.icon ?? 'flag'}</span>
                <span className="text-xs text-on-surface">{q.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {linked.length === 0 && !picker.pickerOpen ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_quests_linked')}</p>
      ) : linked.length > 0 ? (
        <div className="space-y-2">
          {linked.map((quest) => (
            <div key={quest.id} className="bg-surface-container-low border border-outline-variant/10 group/card">
              <div className="flex items-stretch">
                <Link to={`/campaigns/${campaignId}/quests/${quest.id}`}
                  className="group flex items-center gap-3 p-3 hover:bg-surface-container transition-all flex-1 min-w-0">
                  <span className={`material-symbols-outlined text-[16px] ${QUEST_STATUS_PILL[quest.status?.toLowerCase() as QuestStatus]?.iconColor ?? 'text-on-surface-variant/40'}`}>{QUEST_STATUS_PILL[quest.status?.toLowerCase() as QuestStatus]?.icon ?? 'flag'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-sans text-on-surface group-hover:text-primary transition-colors truncate">{quest.title}</p>
                  </div>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </Link>
                {isGm && partyEnabled && (
                  <button
                    onClick={() => setQuestVisibility.mutate({
                      campaignId,
                      id: quest.id,
                      playerVisible: !quest.playerVisible,
                      playerVisibleFields: quest.playerVisibleFields ?? [],
                    })}
                    title={quest.playerVisible ? t('common:visible_click_to_hide') : t('common:hidden_click_to_show')}
                    className={`flex-shrink-0 px-2 border-l border-outline-variant/10 transition-colors ${
                      quest.playerVisible
                        ? 'text-primary/60 hover:text-primary'
                        : 'text-on-surface-variant/20 hover:text-on-surface-variant/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {quest.playerVisible ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                )}
                {isGm && (picker.isAskingRemove(quest.id) ? (
                  <InlineConfirm
                    label={t('confirm_remove')}
                    onYes={() => removeQuest(quest.id)}
                    onNo={picker.cancelRemove}
                  />
                ) : (
                  <button onClick={() => picker.askRemove(quest.id)} title={t('remove_from_session')}
                    className="px-3 border-l border-outline-variant/10 text-on-surface-variant/20 hover:text-error hover:bg-error/5 transition-colors opacity-0 group-hover/card:opacity-100">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </SectionPanel>
  );
}
