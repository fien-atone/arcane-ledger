/**
 * CampaignsPage — thin orchestrator (Tier 3 top-level page).
 *
 * The cross-campaign landing page users see after login. Loads all
 * campaigns via useCampaignsListPage, shows header + active/archived
 * lists + a global session calendar, and opens the create-campaign
 * drawer. All data fetching and business logic live in the hook +
 * section components under features/campaigns/.
 */
import { useTranslation } from 'react-i18next';
import { CampaignCreateDrawer } from '@/features/campaigns';
import { InvitationBanner } from '@/features/invitations/ui/InvitationBanner';
import { SectionBackground } from '@/shared/ui';
import { useCampaignsListPage } from '@/features/campaigns/hooks/useCampaignsListPage';
import {
  CampaignsHeroSection,
  CampaignsActiveListSection,
  CampaignsArchivedListSection,
  CampaignsCalendarSection,
} from '@/features/campaigns/sections';

export default function CampaignsPage() {
  const { t } = useTranslation('campaigns');
  const page = useCampaignsListPage();
  const { campaigns, isLoading, isError, active, archived, createOpen, openCreate, closeCreate } = page;

  return (
    <>
      <SectionBackground />
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        <div className="px-4 sm:px-8 pt-16 max-w-5xl mx-auto w-full pb-20">
          <CampaignsHeroSection onCreate={openCreate} />

          {isLoading && (
            <div className="flex items-center gap-3 text-on-surface-variant p-12">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              {t('loading')}
            </div>
          )}

          {isError && (
            <p className="text-tertiary text-sm p-12">{t('failed_to_load')}</p>
          )}

          {campaigns && campaigns.length === 0 && (
            <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
              <div className="text-center py-16 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl">auto_stories</span>
                <p className="font-headline text-2xl text-on-surface-variant">{t('no_campaigns_title')}</p>
                <p className="text-on-surface-variant/50 text-sm">{t('no_campaigns_desc')}</p>
              </div>
            </div>
          )}

          {/* Pending invitations */}
          <InvitationBanner />

          {/* Two-column layout: campaigns + calendar */}
          {campaigns && campaigns.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left column — campaign lists */}
              <div className="flex-1 min-w-0 space-y-8">
                <CampaignsActiveListSection active={active} />
                <CampaignsArchivedListSection archived={archived} />
              </div>

              {/* Right column — calendar */}
              <div className="w-full lg:w-72 flex-shrink-0">
                <CampaignsCalendarSection campaigns={campaigns} />
              </div>
            </div>
          )}
        </div>
      </main>

      <CampaignCreateDrawer open={createOpen} onClose={closeCreate} />
    </>
  );
}
