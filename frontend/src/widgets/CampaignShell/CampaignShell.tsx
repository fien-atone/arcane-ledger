import { Outlet, useParams, Link } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar';
import { Topbar } from '@/widgets/Topbar';
import { DiceRoller } from '@/widgets/DiceRollerModal';
import { useCampaignUiStore } from '@/features/campaigns/model/store';
import { useCampaign } from '@/features/campaigns/api/queries';
import { CampaignSubscriptionManager } from '@/shared/api/CampaignSubscriptionManager';

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export function CampaignShell() {
  const { id } = useParams<{ id: string }>();
  const collapsed = useCampaignUiStore((s) => s.sidebarCollapsed);
  const { data: campaign, isLoading, isError } = useCampaign(id ?? '');

  if (isLoading) {
    return (
      <div className="flex h-screen bg-surface text-on-surface items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary mr-3">progress_activity</span>
        <span className="text-on-surface-variant">Loading campaign…</span>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="flex h-screen bg-surface text-on-surface items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">error</span>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Campaign not found</h1>
          <p className="text-sm text-on-surface-variant/50">This campaign may have been deleted or you don't have access.</p>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      {!useMock && id && <CampaignSubscriptionManager campaignId={id} />}
      <Sidebar />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Topbar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <DiceRoller />
    </div>
  );
}
