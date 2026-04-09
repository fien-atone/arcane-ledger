/**
 * CampaignsArchivedListSection — "Archive" card-panel listing the viewer's
 * archived campaigns. Renders nothing when the list is empty.
 */
import { useTranslation } from 'react-i18next';
import { SectionPanel } from '@/shared/ui';
import { CampaignRow } from './CampaignRow';
import type { CampaignSummary } from '@/entities/campaign';

interface Props {
  archived: CampaignSummary[];
}

export function CampaignsArchivedListSection({ archived }: Props) {
  const { t } = useTranslation('campaigns');
  if (archived.length === 0) return null;

  return (
    <SectionPanel>
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/40">{t('common:archive')}</h3>
        <div className="h-px flex-1 bg-outline-variant/10" />
        <span className="text-[10px] text-on-surface-variant/30">{archived.length}</span>
      </div>
      <div className="space-y-3">
        {archived.map((c) => <CampaignRow key={c.id} campaign={c} />)}
      </div>
    </SectionPanel>
  );
}
