/**
 * QuestSessionsSection — sessions where this quest progressed.
 *
 * Gated on the Sessions module being enabled. Returns null when the module
 * is disabled or the quest has no linked sessions, matching the original
 * QuestDetailPage behavior exactly.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import type { Quest } from '@/entities/quest';

interface Props {
  campaignId: string;
  quest: Quest;
  sessionsEnabled: boolean;
}

export function QuestSessionsSection({ campaignId, quest, sessionsEnabled }: Props) {
  const { t } = useTranslation('quests');
  if (!sessionsEnabled) return null;

  const linkedSessions = [...(quest.sessions ?? [])].sort((a, b) => b.number - a.number);
  if (linkedSessions.length === 0) return null;

  return (
    <SectionPanel title={t('section_sessions')}>
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
    </SectionPanel>
  );
}
