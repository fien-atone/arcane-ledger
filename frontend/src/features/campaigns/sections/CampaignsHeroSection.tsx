/**
 * CampaignsHeroSection — header card at the top of the cross-campaign
 * landing page. Renders the "My Campaigns" title and the Create Campaign
 * CTA. Presentation-only; the drawer open state lives in the page hook.
 */
import { useTranslation } from 'react-i18next';

interface Props {
  onCreate: () => void;
}

export function CampaignsHeroSection({ onCreate }: Props) {
  const { t } = useTranslation('campaigns');

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
      <div className="flex items-baseline justify-between">
        <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
          {t('my_campaigns')}
        </h1>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-primary/10"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {t('create_campaign')}
        </button>
      </div>
    </div>
  );
}
