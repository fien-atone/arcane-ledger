import { Link } from 'react-router-dom';
import type { CampaignSummary } from '@/entities/campaign';
import { cn } from '@/shared/lib/cn';

interface CampaignCardProps {
  campaign: CampaignSummary;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const isArchived = !!campaign.archivedAt;

  return (
    <Link to={`/campaigns/${campaign.id}`} className="block group">
      <article
        className={cn(
          'flex flex-col bg-surface-container-low transition-all duration-500 hover:-translate-y-1 border-b border-outline-variant/10 overflow-hidden',
          isArchived && 'opacity-70 hover:opacity-100'
        )}
      >
        {/* Cover */}
        <div
          className={cn(
            'relative aspect-[16/10] overflow-hidden',
            isArchived && 'grayscale group-hover:grayscale-0 transition-all duration-700'
          )}
        >
          <div
            className="w-full h-full"
            style={{ background: campaign.coverGradient }}
          />

          {/* Campaign initial — editorial accent */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-headline text-[8rem] font-bold text-on-surface/5 select-none leading-none">
              {campaign.title[0]}
            </span>
          </div>

          {/* Status badge */}
          <div className="absolute top-4 left-4">
            {isArchived ? (
              <span className="bg-outline-variant/80 backdrop-blur-md text-on-surface text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Archived
              </span>
            ) : (
              <span className="bg-secondary-container/90 backdrop-blur-md text-on-secondary-container text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Active
              </span>
            )}
          </div>

          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent" />
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 flex-grow">
          <h3 className="font-headline text-2xl font-bold text-on-surface">
            {campaign.title}
          </h3>

          <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 pt-4">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="font-label text-[10px] uppercase tracking-tighter text-on-surface-variant">
                  Sessions
                </span>
                <span className="text-primary font-medium">{campaign.sessionCount}</span>
              </div>
              <div className="flex flex-col border-l border-outline-variant/20 pl-4">
                <span className="font-label text-[10px] uppercase tracking-tighter text-on-surface-variant">
                  Players
                </span>
                <span className="text-primary font-medium">{campaign.memberCount - 1}</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors">
              arrow_forward
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
