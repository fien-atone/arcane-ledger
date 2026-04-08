/**
 * CampaignDashboard hero header — title (inline editable for GM),
 * description (InlineRichField), manage-sections button, archive/restore
 * button with inline confirm, and the quick-nav grid beneath the header.
 *
 * The header and quick-nav live together because they are visually part of
 * the same outer card and share the campaign + enabled-sections context.
 */
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { InlineRichField } from '@/shared/ui';
import { useSessions } from '@/features/sessions/api/queries';
import { useQuests } from '@/features/quests/api';
import { useNpcs } from '@/features/npcs/api/queries';
import { useLocations } from '@/features/locations/api';
import { useGroups } from '@/features/groups/api';
import type { CampaignSection, CampaignSummary } from '@/entities/campaign';

interface Props {
  campaignId: string;
  campaign: CampaignSummary;
  isGm: boolean;
  sectionOn: (section: CampaignSection) => boolean;
  editingTitle: boolean;
  titleDraft: string;
  onTitleDraftChange: (v: string) => void;
  onStartEditTitle: () => void;
  onCommitTitle: () => void;
  onCancelEditTitle: () => void;
  confirmArchive: boolean;
  onRequestArchive: () => void;
  onCancelArchive: () => void;
  onToggleArchive: () => void;
  onOpenSections: () => void;
  onSaveDescription: (html: string) => void;
}

export function DashboardHeroSection({
  campaignId,
  campaign,
  isGm,
  sectionOn,
  editingTitle,
  titleDraft,
  onTitleDraftChange,
  onStartEditTitle,
  onCommitTitle,
  onCancelEditTitle,
  confirmArchive,
  onRequestArchive,
  onCancelArchive,
  onToggleArchive,
  onOpenSections,
  onSaveDescription,
}: Props) {
  const { t } = useTranslation('campaigns');

  const { data: sessions } = useSessions(campaignId);
  const { data: allQuests } = useQuests(campaignId);
  const { data: allNpcs } = useNpcs(campaignId);
  const { data: allLocations } = useLocations(campaignId);
  const { data: allGroups } = useGroups(campaignId);

  const npcCount = allNpcs?.length ?? 0;
  const locationCount = allLocations?.length ?? 0;
  const groupCount = allGroups?.length ?? 0;
  const sessionCount = sessions?.length ?? 0;
  const activeQuests = (allQuests ?? []).filter((q) => q.status === 'active');
  const questTotal = allQuests?.length ?? 0;
  const questActiveCount = activeQuests.length;

  const quickNavItems = [
    { label: t('common:nav_items.sessions'), section: 'sessions' as CampaignSection, count: String(sessionCount), icon: 'auto_stories', to: 'sessions' },
    { label: t('common:nav_items.npcs'), section: 'npcs' as CampaignSection, count: String(npcCount), icon: 'person', to: 'npcs' },
    { label: t('common:nav_items.locations'), section: 'locations' as CampaignSection, count: String(locationCount), icon: 'location_on', to: 'locations' },
    { label: t('common:nav_items.groups'), section: 'groups' as CampaignSection, count: String(groupCount), icon: 'groups', to: 'groups' },
    { label: t('common:nav_items.quests'), section: 'quests' as CampaignSection, count: `${questActiveCount}/${questTotal}`, sub: 'active', icon: 'auto_awesome', to: 'quests' },
    { label: t('common:nav_items.social_graph'), section: 'social_graph' as CampaignSection, icon: 'hub', to: 'npcs/relationships' },
    ...(isGm ? [{ label: t('common:nav_items.species'), section: 'species' as CampaignSection, icon: 'blur_on', to: 'species' }] : []),
  ].filter((item) => sectionOn(item.section));

  return (
    <header className="relative bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
      {isGm && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2">
          <button
            onClick={onOpenSections}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:border-primary/30 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">settings</span>
            {t('common:sections')}
          </button>
          {confirmArchive ? (
            <div className="flex items-center gap-2 px-3 py-2 border border-outline-variant/20 bg-surface-container-high rounded-sm">
              <span className="text-[10px] text-on-surface-variant">
                {campaign.archivedAt ? t('dashboard.restore_confirm') : t('dashboard.archive_confirm')}
              </span>
              <button
                onClick={onToggleArchive}
                className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-primary hover:text-on-surface transition-colors"
              >
                {t('common:yes')}
              </button>
              <button
                onClick={onCancelArchive}
                className="px-2 py-0.5 text-[10px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {t('common:no')}
              </button>
            </div>
          ) : (
            <button
              onClick={onRequestArchive}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-outline-variant/20 text-on-surface-variant text-[10px] font-label uppercase tracking-widest rounded-sm hover:border-outline-variant/40 hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {campaign.archivedAt ? 'unarchive' : 'archive'}
              </span>
              {campaign.archivedAt ? t('common:restore') : t('common:archive')}
            </button>
          )}
        </div>
      )}

      {isGm && editingTitle ? (
        <div className="flex items-center gap-3 mb-2">
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => onTitleDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && titleDraft.trim()) onCommitTitle();
              if (e.key === 'Escape') onCancelEditTitle();
            }}
            className="font-headline text-5xl lg:text-6xl font-bold text-on-surface bg-transparent border-b-2 border-primary/40 focus:border-primary outline-none flex-1 min-w-0"
          />
          <button
            onClick={onCommitTitle}
            className="p-2 text-primary hover:bg-primary/10 rounded-sm transition-colors"
          >
            <span className="material-symbols-outlined text-lg">check</span>
          </button>
          <button
            onClick={onCancelEditTitle}
            className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      ) : isGm ? (
        <h1
          className="font-headline text-5xl lg:text-6xl font-bold text-on-surface mb-2 cursor-pointer hover:text-primary/80 transition-colors group"
          onClick={onStartEditTitle}
          title={t('dashboard.click_to_edit')}
        >
          {campaign.title}
          <span className="material-symbols-outlined text-lg text-on-surface-variant/0 group-hover:text-primary/40 transition-colors ml-3 align-middle">edit</span>
        </h1>
      ) : (
        <h1 className="font-headline text-5xl lg:text-6xl font-bold text-on-surface mb-2">
          {campaign.title}
        </h1>
      )}

      <div>
        <InlineRichField
          label=""
          value={campaign.description}
          onSave={onSaveDescription}
          placeholder={t('dashboard.description_placeholder')}
        />
      </div>

      {quickNavItems.length > 0 && (
        <div className="border-t border-outline-variant/10 pt-5 mt-5">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 justify-items-center">
            {quickNavItems.map(({ label, count, icon, to }) => (
              <Link
                key={to}
                to={`/campaigns/${campaignId}/${to}`}
                className="group flex flex-col items-center gap-1.5 w-full py-3 px-2 bg-surface-container-high border border-outline-variant/15 hover:border-primary/30 hover:bg-surface-container-highest rounded-sm transition-colors"
              >
                <span className="material-symbols-outlined text-primary/60 group-hover:text-primary transition-colors text-[20px]">{icon}</span>
                <span className="text-[8px] font-label uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">{label}</span>
                {count && <span className="text-xs font-bold text-primary">{count}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
