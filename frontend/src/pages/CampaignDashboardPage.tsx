/**
 * CampaignDashboardPage — thin orchestrator (Tier 3 top-level page).
 *
 * Reads the campaign id, loads the root campaign via useCampaignDashboard,
 * and composes the dashboard section widgets. All data fetching and
 * business logic live in the hook + section components under
 * features/campaigns/.
 */
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SectionBackground } from '@/shared/ui';
import { ManageSectionsDrawer } from '@/features/campaigns/ui/ManageSectionsDrawer';
import { useCampaignDashboard } from '@/features/campaigns/hooks/useCampaignDashboard';
import {
  DashboardHeroSection,
  DashboardNextSessionSection,
  DashboardRecentSessionsSection,
  DashboardActiveQuestsSection,
  DashboardCalendarSection,
  DashboardPartySection,
} from '@/features/campaigns/sections';
import type { CampaignSummary } from '@/entities/campaign';

export default function CampaignDashboardPage() {
  const { t } = useTranslation('campaigns');
  const { id } = useParams<{ id: string }>();
  const campaignId = id ?? '';

  const dash = useCampaignDashboard(campaignId);
  const {
    campaign,
    isLoading,
    isGm,
    sectionOn,
    editingTitle,
    titleDraft,
    setTitleDraft,
    startEditTitle,
    commitTitle,
    cancelEditTitle,
    confirmArchive,
    setConfirmArchive,
    toggleArchive,
    sectionsOpen,
    setSectionsOpen,
    saveDescription,
  } = dash;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin mr-3">progress_activity</span>
        {t('dashboard.loading')}
      </div>
    );
  }

  if (!campaign) {
    return <div className="p-12 text-on-surface-variant">{t('dashboard.not_found')}</div>;
  }

  return (
    <>
      <SectionBackground />
      <div className="flex-1 min-h-screen overflow-y-auto relative z-10">
        <div className="flex justify-center pt-0 pb-8">
          <Link
            to="/campaigns"
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            {campaign?.title ?? t('common:campaign')}
          </Link>
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 pb-20">
          <DashboardHeroSection
            campaignId={campaignId}
            campaign={campaign}
            isGm={isGm}
            sectionOn={sectionOn}
            editingTitle={editingTitle}
            titleDraft={titleDraft}
            onTitleDraftChange={setTitleDraft}
            onStartEditTitle={startEditTitle}
            onCommitTitle={commitTitle}
            onCancelEditTitle={cancelEditTitle}
            confirmArchive={confirmArchive}
            onRequestArchive={() => setConfirmArchive(true)}
            onCancelArchive={() => setConfirmArchive(false)}
            onToggleArchive={toggleArchive}
            onOpenSections={() => setSectionsOpen(true)}
            onSaveDescription={saveDescription}
          />

          <div className="grid grid-cols-12 gap-8">
            {/* -- Left column (8/12) -- */}
            <div className="col-span-12 lg:col-span-8 space-y-8">
              {sectionOn('sessions') && <DashboardNextSessionSection campaignId={campaignId} />}
              {sectionOn('sessions') && <DashboardRecentSessionsSection campaignId={campaignId} />}
              {sectionOn('quests') && <DashboardActiveQuestsSection campaignId={campaignId} />}
            </div>

            {/* -- Right column (4/12) -- */}
            <div className="col-span-12 lg:col-span-4 space-y-8">
              {sectionOn('sessions') && <DashboardCalendarSection campaignId={campaignId} />}
              {sectionOn('party') && (
                <DashboardPartySection
                  campaignId={campaignId}
                  speciesEnabled={sectionOn('species')}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ManageSectionsDrawer
        open={sectionsOpen}
        onClose={() => setSectionsOpen(false)}
        campaign={campaign as CampaignSummary}
      />
    </>
  );
}
