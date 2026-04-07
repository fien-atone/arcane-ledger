import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuest, useSaveQuest, useDeleteQuest, useSetQuestVisibility } from '@/features/quests/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { QuestEditDrawer } from '@/features/quests/ui';
import { InlineRichField, SectionDisabled, SectionBackground, VisibilityPanel } from '@/shared/ui';
import { QUEST_VISIBILITY_FIELDS, QUEST_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { Quest, QuestStatus } from '@/entities/quest';

const STATUS_STYLE: Record<QuestStatus, { icon: string; pill: string }> = {
  active:       { icon: 'bolt',          pill: 'bg-secondary/10 text-secondary border border-secondary/20' },
  completed:    { icon: 'check_circle',  pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  failed:       { icon: 'cancel',        pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  unavailable:  { icon: 'block',         pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20' },
  undiscovered: { icon: 'visibility_off', pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10' },
};

export default function QuestDetailPage() {
  const { t } = useTranslation('quests');
  const { id: campaignId, questId } = useParams<{ id: string; questId: string }>();
  const questsEnabled = useSectionEnabled(campaignId ?? '', 'quests');
  const npcsEnabled = useSectionEnabled(campaignId ?? '', 'npcs');
  const sessionsEnabled = useSectionEnabled(campaignId ?? '', 'sessions');
  const partyEnabled = useSectionEnabled(campaignId ?? '', 'party');
  const { data: campaign } = useCampaign(campaignId ?? '');
  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const { data: quest, isLoading, isError } = useQuest(campaignId ?? '', questId ?? '');
  const saveQuest = useSaveQuest(campaignId ?? '');
  const deleteQuest = useDeleteQuest(campaignId ?? '');
  const setQuestVisibility = useSetQuestVisibility();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const saveField = useCallback((field: keyof Quest, html: string) => {
    if (!quest) return;
    saveQuest.mutate({ ...quest, [field]: html || undefined });
  }, [quest, saveQuest]);

  if (!questsEnabled) {
    return <SectionDisabled campaignId={campaignId ?? ''} />;
  }

  if (isLoading && !quest) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !quest) {
    return (
      <main className="p-12">
        <p className="text-tertiary text-sm">{t('not_found')}</p>
      </main>
    );
  }

  const st = { ...STATUS_STYLE[quest.status], label: t(`status_${quest.status}`) };
  const giver = quest.giver;
  const linkedSessions = [...(quest.sessions ?? [])].sort((a, b) => b.number - a.number);

  return (
    <>
    <SectionBackground />
    <main className="flex-1 min-h-screen relative z-10">
      {/* Campaign name */}
      <div className="flex justify-center pt-0 pb-8">
        <Link
          to={`/campaigns/${campaignId}`}
          className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          {campaign?.title ?? t('common:campaign')}
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
        {/* Header card (full width) */}
        <section className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8 mb-8">
          <div className="flex flex-wrap items-center gap-3 relative mb-4">
            {isGm ? (
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity ${st.pill}`}
              >
                <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
                {st.label}
                <span className="material-symbols-outlined text-[11px] ml-0.5">expand_more</span>
              </button>
            ) : (
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${st.pill}`}>
                <span className="material-symbols-outlined text-[13px]">{st.icon}</span>
                {st.label}
              </span>
            )}
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-surface-container border border-outline-variant/20 rounded-sm shadow-xl py-1 min-w-[160px]">
                {(Object.keys(STATUS_STYLE) as QuestStatus[]).map((key) => {
                  const cfg = { ...STATUS_STYLE[key], label: t(`status_${key}`) };
                  return (
                  <button
                    key={key}
                    onClick={() => {
                      saveQuest.mutate({ ...quest, status: key });
                      setStatusOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs hover:bg-surface-container-high transition-colors ${quest.status === key ? 'text-primary font-bold' : 'text-on-surface-variant'}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                    {cfg.label}
                  </button>
                  );
                })}
              </div>
            )}
          </div>
          <h1 className={`font-headline text-3xl sm:text-5xl font-bold text-on-surface tracking-tight leading-tight ${quest.status === 'unavailable' ? 'opacity-50' : ''}`}>
            {quest.title}
          </h1>

          {/* Edit/Delete — absolute top-right */}
          {isGm && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
              {confirmDelete ? (
                <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                  <span className="text-[9px] text-on-surface-variant">{t('confirm_delete')}</span>
                  <button
                    onClick={() => deleteQuest.mutate(quest.id, { onSuccess: () => navigate(`/campaigns/${campaignId}/quests`) })}
                    className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                  >
                    {t('confirm_yes')}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {t('confirm_no')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 border border-outline-variant/30 text-on-surface-variant/40 rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                {t('edit')}
              </button>
            </div>
          )}
        </section>

        {/* Two-column layout */}
        <div className="flex flex-col md:flex-row gap-8 min-w-0">

          {/* Left column — Description, GM Notes */}
          <div className="flex-1 min-w-0 space-y-8">
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <InlineRichField
                label={t('section_description')}
                value={quest.description}
                onSave={(html) => saveField('description', html)}
                placeholder={t('placeholder_description')}
                readOnly={!isGm}
              />
            </div>

            {isGm && (
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                <InlineRichField
                  label={t('section_gm_notes')}
                  value={quest.notes}
                  onSave={(html) => saveField('notes', html)}
                  isGmNotes
                />
              </div>
            )}
          </div>

          {/* Right column — Quest Giver, Reward, Sessions, Visibility */}
          <div className="md:w-[35%] space-y-8">

            {/* Quest giver */}
            {npcsEnabled && (
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
                    {t('section_quest_giver')}
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
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
              </div>
            )}

            {/* Reward */}
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
                  {t('section_reward')}
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              <InlineRichField
                label=""
                value={quest.reward}
                onSave={(html) => saveField('reward', html)}
                placeholder={t('placeholder_reward')}
                readOnly={!isGm}
              />
            </div>

            {/* Session Appearances */}
            {sessionsEnabled && linkedSessions.length > 0 && (
              <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
                    {t('section_sessions')}
                  </h2>
                  <div className="h-px flex-1 bg-outline-variant/20" />
                </div>
                <div className="space-y-2">
                  {linkedSessions.map((s) => (
                    <Link
                      key={s.id}
                      to={`/campaigns/${campaignId}/sessions/${s.id}`}
                      className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-sm bg-surface-container flex items-center justify-center flex-shrink-0 border border-outline-variant/15">
                        <span className="font-headline text-xs font-bold italic text-on-surface-variant/50">
                          {String(s.number).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface group-hover:text-primary transition-colors truncate">{s.title}</p>
                        {s.datetime && (
                          <p className="text-[10px] text-on-surface-variant/40">
                            {new Date(s.datetime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Player Visibility */}
            {isGm && partyEnabled && quest && (
              <VisibilityPanel
                playerVisible={quest.playerVisible ?? false}
                playerVisibleFields={quest.playerVisibleFields ?? []}
                fields={QUEST_VISIBILITY_FIELDS}
                basicPreset={QUEST_BASIC_PRESET}
                onToggleVisible={(v) => setQuestVisibility.mutate({
                  campaignId: campaignId!, id: quest.id,
                  playerVisible: v, playerVisibleFields: quest.playerVisibleFields ?? [],
                })}
                onToggleField={(f, on) => {
                  const fields = on
                    ? [...(quest.playerVisibleFields ?? []), f]
                    : (quest.playerVisibleFields ?? []).filter((x) => x !== f);
                  setQuestVisibility.mutate({
                    campaignId: campaignId!, id: quest.id,
                    playerVisible: quest.playerVisible ?? false, playerVisibleFields: fields,
                  });
                }}
                onSetPreset={(fields) => setQuestVisibility.mutate({
                  campaignId: campaignId!, id: quest.id,
                  playerVisible: quest.playerVisible ?? false, playerVisibleFields: fields,
                })}
                isPending={setQuestVisibility.isPending}
              />
            )}

          </div>

        </div>
      </div>

    </main>

    <QuestEditDrawer
      open={editOpen}
      onClose={() => setEditOpen(false)}
      campaignId={campaignId ?? ''}
      quest={quest}
    />
    </>
  );
}
