import { useTranslation } from 'react-i18next';
import { useUpdateCampaignSections, getEnabledSections } from '../api/queries';
import { ALL_SECTIONS } from '@/entities/campaign';
import type { CampaignSection, CampaignSummary } from '@/entities/campaign';

interface SectionItem {
  id: CampaignSection;
  labelKey: string;
  icon: string;
  sub?: boolean;
}

interface SectionGroup {
  titleKey: string;
  icon: string;
  items: SectionItem[];
}

const SECTION_GROUPS: SectionGroup[] = [
  {
    titleKey: 'nav_sections.world',
    icon: 'public',
    items: [
      { id: 'locations', labelKey: 'nav_items.locations', icon: 'location_on' },
      { id: 'location_types', labelKey: 'nav_items.location_types', icon: 'account_tree' },
      { id: 'npcs', labelKey: 'nav_items.npcs', icon: 'group' },
      { id: 'groups', labelKey: 'nav_items.groups', icon: 'groups' },
      { id: 'group_types', labelKey: 'nav_items.group_types', icon: 'category' },
      { id: 'species', labelKey: 'nav_items.species', icon: 'blur_on' },
      { id: 'species_types', labelKey: 'nav_items.species_types', icon: 'category' },
    ],
  },
  {
    titleKey: 'nav_sections.adventure',
    icon: 'auto_stories',
    items: [
      { id: 'sessions', labelKey: 'nav_items.sessions', icon: 'event' },
      { id: 'party', labelKey: 'nav_items.party', icon: 'shield_person' },
      { id: 'quests', labelKey: 'nav_items.quests', icon: 'assignment' },
      { id: 'social_graph', labelKey: 'nav_items.social_graph', icon: 'hub' },
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  campaign: CampaignSummary;
}

export function ManageSectionsDrawer({ open, onClose, campaign }: Props) {
  const { t } = useTranslation('common');
  const { mutate, isPending } = useUpdateCampaignSections();
  const enabled = getEnabledSections(campaign);
  const enabledSet = new Set(enabled);

  if (!open) return null;

  const isAllEnabled =
    !campaign.enabledSections || campaign.enabledSections.length === 0;

  const applySections = (next: CampaignSection[]) => {
    const allOn = ALL_SECTIONS.every((s) => next.includes(s));
    mutate(campaign.id, allOn ? [] : next);
  };

  const handleToggle = (section: CampaignSection) => {
    let next: CampaignSection[];
    if (isAllEnabled) {
      next = ALL_SECTIONS.filter((s) => s !== section);
    } else if (enabledSet.has(section)) {
      next = enabled.filter((s) => s !== section);
    } else {
      next = [...enabled, section];
    }
    applySections(next);
  };

  const handleToggleGroup = (group: SectionGroup) => {
    const groupIds = group.items.map((i) => i.id);
    const allOn = groupIds.every((id) => enabledSet.has(id));

    let base = isAllEnabled ? [...ALL_SECTIONS] : [...enabled];
    if (allOn) {
      // Turn off all in group
      base = base.filter((s) => !groupIds.includes(s));
    } else {
      // Turn on all in group
      for (const id of groupIds) {
        if (!base.includes(id)) base.push(id);
      }
    }
    applySections(base);
  };

  return (
    <>
      <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-70 w-full max-w-md flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline-variant/10 flex-shrink-0">
          <div>
            <h2 className="font-headline text-lg font-bold text-on-surface">{t('manage_sections.title')}</h2>
            <p className="text-xs text-on-surface-variant/50 mt-0.5">{t('manage_sections.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant/50 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Section list */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Dashboard — always on */}
          <div className="flex items-center gap-4 px-3 py-2 opacity-50">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">dashboard</span>
            <span className="flex-1 text-sm text-on-surface">{t('nav.dashboard')}</span>
            <span className="text-[9px] font-label uppercase tracking-widest text-on-surface-variant/40">{t('manage_sections.always_on')}</span>
          </div>

          {SECTION_GROUPS.map((group) => {
            const groupIds = group.items.map((i) => i.id);
            const allGroupOn = groupIds.every((id) => enabledSet.has(id));
            const someGroupOn = groupIds.some((id) => enabledSet.has(id));

            return (
              <div key={group.titleKey}>
                {/* Group header with toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleGroup(group)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 mb-2 group"
                >
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40">{group.icon}</span>
                  <span className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface-variant/50 flex-1 text-left">
                    {t(group.titleKey)}
                  </span>
                  <div
                    className={`relative w-8 h-4 rounded-full transition-colors ${
                      allGroupOn ? 'bg-primary/80' : someGroupOn ? 'bg-primary/40' : 'bg-outline-variant/30'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 rounded-full bg-on-surface shadow-sm transition-all ${
                        allGroupOn ? 'left-[18px]' : someGroupOn ? 'left-[9px]' : 'left-0.5'
                      }`}
                    />
                  </div>
                </button>

                {/* Items */}
                <div className="space-y-0.5 ml-1 border-l border-outline-variant/10 pl-4">
                  {group.items.map((item) => {
                    const isOn = enabledSet.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        disabled={isPending}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-surface-container transition-colors"
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] transition-colors ${isOn ? 'text-primary' : 'text-on-surface-variant/30'}`}
                        >
                          {item.icon}
                        </span>
                        <span className={`flex-1 text-sm text-left transition-colors ${isOn ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                          {t(item.labelKey)}
                        </span>
                        <div
                          className={`relative w-9 h-[18px] rounded-full transition-colors ${
                            isOn ? 'bg-primary/80' : 'bg-outline-variant/30'
                          }`}
                        >
                          <div
                            className={`absolute top-[3px] w-3 h-3 rounded-full bg-on-surface shadow-sm transition-all ${
                              isOn ? 'left-[20px]' : 'left-[3px]'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-8 py-4 border-t border-outline-variant/10 flex-shrink-0">
          <p className="text-[10px] text-on-surface-variant/40 leading-relaxed">
            {t('manage_sections.footer_hint')}
          </p>
        </div>
      </div>
    </>
  );
}
