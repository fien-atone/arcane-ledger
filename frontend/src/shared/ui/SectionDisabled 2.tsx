import { Link, useNavigate } from 'react-router-dom';
import { useCampaignUiStore } from '@/features/campaigns/model/store';

interface SectionDisabledProps {
  campaignId: string;
}

/** Shown when a user navigates to a route whose section is disabled for the campaign. */
export function SectionDisabled({ campaignId }: SectionDisabledProps) {
  const navigate = useNavigate();
  const setEditMode = useCampaignUiStore((s) => s.setEditMode);

  const handleEnableSections = () => {
    setEditMode(true);
    navigate(`/campaigns/${campaignId}`);
  };

  return (
    <main className="flex-1 flex items-center justify-center bg-surface min-h-screen">
      <div className="text-center space-y-6 max-w-md px-8">
        {/* Icon */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-surface-container-low border border-outline-variant/15 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/15">visibility_off</span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="font-headline text-xl font-bold text-on-surface">
            Section not enabled
          </h2>
          <p className="text-sm text-on-surface-variant/50 leading-relaxed">
            This section is hidden for this campaign. You can enable it in the sidebar — all your data is preserved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            to={`/campaigns/${campaignId}`}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-label uppercase tracking-widest text-on-surface-variant border border-outline-variant/25 rounded-sm hover:border-outline-variant/50 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Dashboard
          </Link>
          <button
            onClick={handleEnableSections}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-label uppercase tracking-widest text-primary border border-primary/30 rounded-sm hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">tune</span>
            Enable sections
          </button>
        </div>
      </div>
    </main>
  );
}
