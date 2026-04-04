import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuest, useSaveQuest, useDeleteQuest, useSetQuestVisibility } from '@/features/quests/api/queries';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { QuestEditDrawer } from '@/features/quests/ui';
import { BackLink, InlineRichField, SectionDisabled, VisibilityPanel } from '@/shared/ui';
import { QUEST_VISIBILITY_FIELDS, QUEST_BASIC_PRESET } from '@/shared/lib/visibilityFields';
import { resolveImageUrl } from '@/shared/api/imageUrl';
import type { Quest, QuestStatus } from '@/entities/quest';

const STATUS_CONFIG: Record<QuestStatus, { label: string; icon: string; pill: string }> = {
  active:       { label: 'Active',       icon: 'bolt',          pill: 'bg-secondary/10 text-secondary border border-secondary/20' },
  completed:    { label: 'Completed',    icon: 'check_circle',  pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  failed:       { label: 'Failed',       icon: 'cancel',        pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  unavailable:  { label: 'Unavailable',  icon: 'block',         pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20' },
  undiscovered: { label: 'Undiscovered',  icon: 'visibility_off', pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10' },
};

export default function QuestDetailPage() {
  const { id: campaignId, questId } = useParams<{ id: string; questId: string }>();
  const questsEnabled = useSectionEnabled(campaignId ?? '', 'quests');
  const npcsEnabled = useSectionEnabled(campaignId ?? '', 'npcs');
  const sessionsEnabled = useSectionEnabled(campaignId ?? '', 'sessions');
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
        Loading…
      </main>
    );
  }

  if (isError || !quest) {
    return (
      <main className="p-12">
        <BackLink to={`/campaigns/${campaignId}/quests`}>Quests</BackLink>
        <p className="text-tertiary text-sm">Quest not found.</p>
      </main>
    );
  }

  const st = STATUS_CONFIG[quest.status];
  const giver = quest.giver;
  const linkedSessions = [...(quest.sessions ?? [])].sort((a, b) => b.number - a.number);

  return (
    <main className="flex-1 min-h-screen bg-surface">
      <div className="px-10 pt-8">
        <BackLink to={`/campaigns/${campaignId}/quests`}>All Quests</BackLink>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-8 pb-20">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* ── Left column (65%) ──────────────────────────────── */}
          <div className="lg:w-[65%] space-y-12">

            {/* Quest header */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 relative">
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
                    {(Object.entries(STATUS_CONFIG) as [QuestStatus, typeof st][]).map(([key, cfg]) => (
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
                    ))}
                  </div>
                )}
              </div>
              <h1 className={`font-headline text-5xl font-bold text-on-surface tracking-tight leading-tight ${quest.status === 'unavailable' ? 'opacity-50' : ''}`}>
                {quest.title}
              </h1>
            </header>

            {/* Description */}
            <InlineRichField
              label="Description"
              value={quest.description}
              onSave={(html) => saveField('description', html)}
              placeholder="What is this quest about…"
              readOnly={!isGm}
            />

            {/* GM Notes — inline editable, GM only */}
            {isGm && (
              <InlineRichField
                label="GM Notes"
                value={quest.notes}
                onSave={(html) => saveField('notes', html)}
                isGmNotes
              />
            )}
          </div>

          {/* ── Right column (35%) ──────────────────────────────── */}
          <div className="lg:w-[35%] space-y-8 lg:sticky lg:top-8 self-start">

            {/* Actions — GM only */}
            {isGm && (
              <div className="flex justify-end gap-2">
                {confirmDelete ? (
                  <div className="flex items-center gap-2 px-3 py-2 border border-error/30 bg-error/5 rounded-sm">
                    <span className="text-[10px] text-on-surface-variant">Delete this quest?</span>
                    <button
                      onClick={() => deleteQuest.mutate(quest.id, { onSuccess: () => navigate(`/campaigns/${campaignId}/quests`) })}
                      className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-error hover:text-on-surface transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant/30 text-on-surface-variant/40 text-xs font-label uppercase tracking-widest rounded-sm hover:text-error hover:border-error/30 hover:bg-error/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                )}
                <button
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary text-xs font-label uppercase tracking-widest rounded-sm hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Edit Quest
                </button>
              </div>
            )}

            {/* Quest giver */}
            {npcsEnabled && (
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Quest Giver
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
                <p className="text-xs text-on-surface-variant/40 italic">No quest giver set.</p>
              )}
            </section>
            )}

            {/* Reward */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                  Reward
                </h2>
                <div className="h-px flex-1 bg-outline-variant/20" />
              </div>
              <InlineRichField
                label=""
                value={quest.reward}
                onSave={(html) => saveField('reward', html)}
                placeholder="Gold, items, reputation…"
                readOnly={!isGm}
              />
            </section>

            {/* Player Visibility */}
            {isGm && quest && (
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

            {/* Session Appearances */}
            {sessionsEnabled && linkedSessions.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary whitespace-nowrap">
                    Sessions
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
              </section>
            )}

          </div>

        </div>
      </div>

      <QuestEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId ?? ''}
        quest={quest}
      />
    </main>
  );
}
