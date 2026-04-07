/**
 * Sessions where this NPC has appeared. Self-contained: fetches sessions itself.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions } from '@/features/sessions/api';

interface Props {
  campaignId: string;
  npcId: string;
  enabled: boolean;
}

export function NpcSessionsSection({ campaignId, npcId, enabled }: Props) {
  const { t } = useTranslation('npcs');
  const { data: allSessions } = useSessions(campaignId);

  if (!enabled) return null;

  const sessionAppearances = (allSessions ?? [])
    .filter((s) => s.npcIds?.includes(npcId))
    .sort((a, b) => b.number - a.number);

  return (
    <section className="space-y-8 min-w-0">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-primary">
          {t('section_session_appearances')}
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
      </div>
      {sessionAppearances.length === 0 ? (
        <p className="text-xs text-on-surface-variant/40 italic">{t('no_sessions_tagged')}</p>
      ) : (
        <div className="space-y-2">
          {sessionAppearances.map((session) => (
            <Link
              key={session.id}
              to={`/campaigns/${campaignId}/sessions/${session.id}`}
              className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 rounded-sm overflow-hidden transition-all"
            >
              <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[18px]">auto_stories</span>
              <p className="text-sm text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                {t('session_appearance', { number: session.number, title: session.title })}
              </p>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
