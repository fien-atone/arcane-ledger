import { Link } from 'react-router-dom';
import { CampaignCard, useCampaigns } from '@/features/campaigns';

export default function CampaignsPage() {
  const { data: campaigns, isLoading, isError } = useCampaigns();

  return (
    <main className="max-w-7xl mx-auto px-8 py-12 pb-24">
      {/* Editorial header */}
      <section className="mb-16 flex flex-col items-start gap-2">
        <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
          Grand Master's Overview
        </span>
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between w-full gap-4">
          <h1 className="font-headline text-5xl lg:text-6xl font-bold tracking-tight text-on-surface">
            My Campaigns
          </h1>
          <button
            disabled
            className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-sm font-semibold text-xs uppercase tracking-wider opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Create Campaign
          </button>
        </div>
      </section>

      {/* States */}
      {isLoading && (
        <div className="flex items-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading your archives…
        </div>
      )}

      {isError && (
        <p className="text-tertiary text-sm">
          Failed to load campaigns. Check your connection and try again.
        </p>
      )}

      {/* Campaign grid */}
      {campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {campaigns && campaigns.length === 0 && (
        <div className="text-center py-24 flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant/30 text-6xl">
            auto_stories
          </span>
          <p className="font-headline text-2xl text-on-surface-variant">No campaigns yet.</p>
          <p className="text-on-surface-variant/60 text-sm">
            Create the first campaign to get started.
          </p>
        </div>
      )}

      {/* Quick links */}
      {campaigns && campaigns.length > 0 && (
        <div className="mt-16 flex items-center gap-4 border-t border-outline-variant/10 pt-8">
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/40">
            Quick links
          </span>
          {campaigns.map((c) => (
            <Link
              key={c.id}
              to={`/campaigns/${c.id}`}
              className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
              {c.title}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
