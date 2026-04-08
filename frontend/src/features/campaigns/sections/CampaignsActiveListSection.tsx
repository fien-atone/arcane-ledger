/**
 * CampaignsActiveListSection — "Active" card-panel listing the viewer's
 * non-archived campaigns (GM-first, then alphabetical). Renders nothing
 * when the list is empty; the page composes it alongside the archived
 * list in a single left column.
 */
import { useTranslation } from 'react-i18next';
import { CampaignRow } from './CampaignRow';
import type { CampaignSummary } from '@/entities/campaign';

interface Props {
  active: CampaignSummary[];
}

export function CampaignsActiveListSection({ active }: Props) {
  const { t } = useTranslation('campaigns');
  if (active.length === 0) return null;

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{t('common:active')}</h3>
        <div className="h-px flex-1 bg-outline-variant/20" />
        <span className="text-[10px] text-on-surface-variant/30">{active.length}</span>
      </div>
      <div className="space-y-3">
        {active.map((c) => <CampaignRow key={c.id} campaign={c} />)}
      </div>
    </div>
  );
}
