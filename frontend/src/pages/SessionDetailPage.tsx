/**
 * SessionDetailPage — thin orchestrator.
 *
 * Reads route params, loads the root session entity via useSessionDetail,
 * and composes the section widgets. All data fetching, state, and business
 * logic live in the hook + section components under features/sessions/.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSessionDetail } from '@/features/sessions/hooks/useSessionDetail';
import {
  SessionHeroSection,
  SessionBriefSection,
  SessionGmNotesSection,
  SessionMyNotesSection,
  SessionNpcsSection,
  SessionLocationsSection,
  SessionQuestsSection,
} from '@/features/sessions/sections';
import { SessionEditDrawer } from '@/features/sessions/ui';
import { NotFoundState, SectionBackground, SectionDisabled } from '@/shared/ui';

export default function SessionDetailPage() {
  const { t } = useTranslation('sessions');
  const { id: campaignId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const cId = campaignId ?? '';
  const sId = sessionId ?? '';

  const [editOpen, setEditOpen] = useState(false);

  const detail = useSessionDetail(cId, sId);
  const {
    session, prevSession, nextSession, isLoading, isError, isGm,
    sessionsEnabled, locationTypesEnabled, partyEnabled, campaignTitle,
    saveField, saveNote, handleDelete,
  } = detail;

  if (!sessionsEnabled) return <SectionDisabled campaignId={cId} />;

  if (isLoading && !session) {
    return (
      <main className="p-12 flex items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        {t('loading')}
      </main>
    );
  }

  if (isError || !session) {
    return <NotFoundState backTo={`/campaigns/${cId}/sessions`} backLabel={t('title')} />;
  }

  return (
    <>
      <SectionBackground />
      <main className="flex-1 min-h-screen relative z-10">
        {/* Campaign name */}
        <div className="flex justify-center pt-0 pb-8">
          <Link
            to={`/campaigns/${cId}`}
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            {campaignTitle ?? t('common:campaign')}
          </Link>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
          <SessionHeroSection
            campaignId={cId}
            session={session}
            prevSession={prevSession}
            nextSession={nextSession}
            isGm={isGm}
            campaignTitle={campaignTitle}
            onEdit={() => setEditOpen(true)}
            onDelete={handleDelete}
          />

          <div className="flex flex-col md:flex-row gap-8 min-w-0">
            {/* Left column — Brief + Notes */}
            <div className="flex-1 min-w-0 space-y-8">
              <SessionBriefSection session={session} isGm={isGm} onSaveField={saveField} />
              <SessionGmNotesSection session={session} isGm={isGm} onSaveNote={saveNote} />
              <SessionMyNotesSection session={session} isGm={isGm} onSaveNote={saveNote} />
            </div>

            {/* Right column — NPCs / Locations / Quests */}
            <div className="md:w-[35%] space-y-8">
              <SessionNpcsSection
                campaignId={cId}
                session={session}
                isGm={isGm}
                partyEnabled={partyEnabled}
              />
              <SessionLocationsSection
                campaignId={cId}
                session={session}
                isGm={isGm}
                partyEnabled={partyEnabled}
                locationTypesEnabled={locationTypesEnabled}
              />
              <SessionQuestsSection
                campaignId={cId}
                session={session}
                isGm={isGm}
                partyEnabled={partyEnabled}
              />
            </div>
          </div>
        </div>
      </main>

      <SessionEditDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        campaignId={cId}
        session={session}
      />
    </>
  );
}
