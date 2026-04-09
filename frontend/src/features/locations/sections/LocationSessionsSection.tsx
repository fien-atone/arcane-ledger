/**
 * LocationSessionsSection — sessions where this location was visited.
 *
 * Self-contained: fetches the campaign's sessions and filters those whose
 * `locationIds` include the current location. Gated on the Sessions module
 * being enabled.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessions } from '@/features/sessions/api';
import { SectionPanel } from '@/shared/ui';
import type { Location } from '@/entities/location';

interface Props {
  campaignId: string;
  location: Location;
  enabled: boolean;
}

export function LocationSessionsSection({ campaignId, location, enabled }: Props) {
  const { t } = useTranslation('locations');
  const { data: allSessions } = useSessions(campaignId);

  if (!enabled) return null;

  const sessionAppearances = (allSessions ?? [])
    .filter((s) => s.locationIds?.includes(location.id))
    .sort((a, b) => b.number - a.number);

  return (
    <SectionPanel title={t('section_session_appearances')}>
      <section>
        {sessionAppearances.length === 0 ? (
          <p className="text-xs text-on-surface-variant/40 italic">
            {t('no_sessions_tagged')}
          </p>
        ) : (
          <div className="space-y-2">
            {sessionAppearances.map((session) => (
              <Link
                key={session.id}
                to={`/campaigns/${campaignId}/sessions/${session.id}`}
                className="group flex items-center gap-3 p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/10 transition-all min-w-0"
              >
                <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors text-[18px]">
                  auto_stories
                </span>
                <p className="text-sm text-on-surface group-hover:text-primary transition-colors flex-1 truncate">
                  {t('session_appearance', { number: session.number, title: session.title })}
                </p>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant/20 group-hover:text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SectionPanel>
  );
}
