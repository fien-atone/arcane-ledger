/**
 * Quest hero header — status pill with GM dropdown, title, and edit/delete
 * actions. Owns the QuestEditDrawer state and the inline delete-confirm flow.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuestEditDrawer } from '@/features/quests/ui';
import type { Quest, QuestStatus } from '@/entities/quest';

const STATUS_STYLE: Record<QuestStatus, { icon: string; pill: string }> = {
  active:       { icon: 'bolt',           pill: 'bg-secondary/10 text-secondary border border-secondary/20' },
  completed:    { icon: 'check_circle',   pill: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  failed:       { icon: 'cancel',         pill: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
  unavailable:  { icon: 'block',          pill: 'bg-surface-container-highest text-on-surface-variant/50 border border-outline-variant/20' },
  undiscovered: { icon: 'visibility_off', pill: 'bg-surface-variant text-on-surface-variant border border-outline-variant/10' },
};

interface Props {
  campaignId: string;
  quest: Quest;
  isGm: boolean;
  onChangeStatus: (status: QuestStatus) => void;
  onDelete: () => void;
}

export function QuestHeroSection({ campaignId, quest, isGm, onChangeStatus, onDelete }: Props) {
  const { t } = useTranslation('quests');
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const st = { ...STATUS_STYLE[quest.status], label: t(`status_${quest.status}`) };

  return (
    <>
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
                      onChangeStatus(key);
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

        {isGm && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
            {confirmDelete ? (
              <div className="flex items-center gap-1 px-2 py-1.5 border border-error/30 bg-error/5 rounded-sm">
                <span className="text-[9px] text-on-surface-variant">{t('confirm_delete')}</span>
                <button
                  onClick={onDelete}
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

      <QuestEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={campaignId}
        quest={quest}
      />
    </>
  );
}
