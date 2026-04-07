/**
 * SessionHeroSection — header card with session number, title, datetime,
 * and prev/next sibling navigation.
 *
 * Receives the root session entity (and its siblings) from the parent — these
 * are part of the page-level query and don't need to be re-fetched.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Session } from '@/entities/session';
import { SessionActionsSection } from './SessionActionsSection';

interface Props {
  campaignId: string;
  session: Session;
  prevSession: Session | undefined;
  nextSession: Session | undefined;
  isGm: boolean;
  campaignTitle: string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

export function SessionHeroSection({
  campaignId,
  session,
  prevSession,
  nextSession,
  isGm,
  campaignTitle,
  onEdit,
  onDelete,
}: Props) {
  const { t, i18n } = useTranslation('sessions');
  const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    const date = d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
    const h = d.getHours();
    const m = d.getMinutes();
    if (h === 0 && m === 0) return date;
    return `${date}, ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return (
    <section className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 md:p-8 mb-8">
      <div className="flex items-center gap-4 mb-3">
        <span className="text-[10px] font-label uppercase tracking-widest text-primary font-bold">
          {t('session_prefix')}{String(session.number).padStart(2, '0')}
        </span>
        <div className="h-px w-12 bg-outline-variant/30" />
        {session.datetime && (
          <span className="text-sm text-on-surface-variant/60">
            {formatDateTime(session.datetime)}
          </span>
        )}
      </div>
      <h1 className="font-headline text-3xl sm:text-5xl font-bold text-on-surface tracking-tight leading-tight mb-4">
        {session.title}
      </h1>

      {/* Prev / Next navigation */}
      <div className="flex items-center gap-3 mt-2">
        {prevSession ? (
          <Link
            to={`/campaigns/${campaignId}/sessions/${prevSession.id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant/20 rounded-sm text-sm text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            <span>
              <span className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/50 block">{t('nav_previous')}</span>
              <span className="font-medium">{t('session_prefix')}{String(prevSession.number).padStart(2, '0')}</span>
            </span>
          </Link>
        ) : <div />}
        {nextSession && (
          <Link
            to={`/campaigns/${campaignId}/sessions/${nextSession.id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant/20 rounded-sm text-sm text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span>
              <span className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/50 block">{t('nav_next')}</span>
              <span className="font-medium">{t('session_prefix')}{String(nextSession.number).padStart(2, '0')}</span>
            </span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        )}
      </div>

      <SessionActionsSection
        session={session}
        isGm={isGm}
        campaignTitle={campaignTitle}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </section>
  );
}
