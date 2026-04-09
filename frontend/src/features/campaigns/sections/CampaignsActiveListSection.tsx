/**
 * CampaignsActiveListSection — "Active" card-panel listing the viewer's
 * non-archived campaigns (GM-first, then alphabetical). Renders nothing
 * when the list is empty; the page composes it alongside the archived
 * list in a single left column.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import { CampaignRow } from './CampaignRow';
import type { CampaignSummary } from '@/entities/campaign';

interface Props {
  active: CampaignSummary[];
}

export function CampaignsActiveListSection({ active }: Props) {
  const { t } = useTranslation('campaigns');
  if (active.length === 0) return null;

  return (
    <SectionPanel
      size="sm"
      title={t('common:active')}
      action={<span className="text-[10px] text-on-surface-variant/30">{active.length}</span>}
    >
      <div className="space-y-3">
        {active.map((c) => <CampaignRow key={c.id} campaign={c} />)}
      </div>
    </SectionPanel>
  );
}
