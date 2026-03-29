import { Link } from 'react-router-dom';

interface SectionDisabledProps {
  campaignId: string;
}

/** Shown when a user navigates to a route whose section is disabled for the campaign. */
export function SectionDisabled({ campaignId }: SectionDisabledProps) {
  return (
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">block</span>
        <p className="text-on-surface-variant">This section is not enabled for this campaign.</p>
        <p className="text-xs text-on-surface-variant/40">Enable it in campaign settings.</p>
        <Link
          to={`/campaigns/${campaignId}`}
          className="inline-block mt-4 px-5 py-2 text-xs font-label uppercase tracking-widest text-primary border border-primary/30 rounded-sm hover:bg-primary/5 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
