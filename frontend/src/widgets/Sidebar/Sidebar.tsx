import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useCampaignUiStore } from '@/features/campaigns/model/store';
import { useCampaign, getEnabledSections, useUpdateCampaignSections } from '@/features/campaigns/api/queries';
import { ChangelogDrawer, getHasUnread } from '@/widgets/Changelog/ChangelogDrawer';
import { ALL_SECTIONS } from '@/entities/campaign';
import type { CampaignSection } from '@/entities/campaign';

interface NavItem {
  label: string;
  icon: string;
  to: (id: string) => string;
  exact: boolean;
  sub?: boolean;
  sectionId?: CampaignSection;
  gmOnly?: boolean;
}

interface NavSection {
  section: string;
  sectionIds: CampaignSection[]; // all section IDs in this group
  items: NavItem[];
}

const NAV: Array<NavItem | NavSection> = [
  { label: 'Dashboard', icon: 'dashboard', to: (id) => `/campaigns/${id}`, exact: true },
  {
    section: 'World',
    sectionIds: ['locations', 'location_types', 'npcs', 'groups', 'group_types', 'species', 'species_types'],
    items: [
      { label: 'Locations', icon: 'location_on', to: (id) => `/campaigns/${id}/locations`, exact: false, sectionId: 'locations' },
      { label: 'Location Types', icon: 'account_tree', to: (id) => `/campaigns/${id}/location-types`, exact: false, sub: true, sectionId: 'location_types', gmOnly: true },
      { label: 'NPCs', icon: 'group', to: (id) => `/campaigns/${id}/npcs`, exact: false, sectionId: 'npcs' },
      { label: 'Groups', icon: 'groups', to: (id) => `/campaigns/${id}/groups`, exact: false, sectionId: 'groups' },
      { label: 'Group Types', icon: 'category', to: (id) => `/campaigns/${id}/group-types`, exact: false, sub: true, sectionId: 'group_types', gmOnly: true },
      { label: 'Species', icon: 'blur_on', to: (id) => `/campaigns/${id}/species`, exact: false, sectionId: 'species', gmOnly: true },
      { label: 'Species Types', icon: 'category', to: (id) => `/campaigns/${id}/species-types`, exact: false, sub: true, sectionId: 'species_types', gmOnly: true },
    ],
  },
  {
    section: 'Adventure',
    sectionIds: ['sessions', 'party', 'quests', 'social_graph'],
    items: [
      { label: 'Sessions', icon: 'event', to: (id) => `/campaigns/${id}/sessions`, exact: false, sectionId: 'sessions' },
      { label: 'Party', icon: 'shield_person', to: (id) => `/campaigns/${id}/party`, exact: false, sectionId: 'party' },
      { label: 'Quests', icon: 'assignment', to: (id) => `/campaigns/${id}/quests`, exact: false, sectionId: 'quests' },
      { label: 'Social Graph', icon: 'hub', to: (id) => `/campaigns/${id}/npcs/relationships`, exact: false, sectionId: 'social_graph' },
    ],
  },
];

function SectionToggle({ on, onClick, small }: { on: boolean; onClick: () => void; small?: boolean }) {
  const w = small ? 'w-7' : 'w-8';
  const h = small ? 'h-3.5' : 'h-4';
  const dot = small ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const onPos = small ? 'left-[15px]' : 'left-[18px]';
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      className={`${w} ${h} rounded-full transition-colors flex-shrink-0 relative ${on ? 'bg-primary/80' : 'bg-outline-variant/30'}`}
    >
      <div className={`absolute top-0.5 ${dot} rounded-full bg-on-surface shadow-sm transition-all ${on ? onPos : 'left-0.5'}`} />
    </button>
  );
}

export function Sidebar() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();

  const collapsed = useCampaignUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useCampaignUiStore((s) => s.toggleSidebar);
  const { data: campaign } = useCampaign(id ?? '');
  const { mutate: updateSections } = useUpdateCampaignSections();

  const [changelogOpen, setChangelogOpen] = useState(false);
  const editMode = useCampaignUiStore((s) => s.editMode);
  const setEditMode = useCampaignUiStore((s) => s.setEditMode);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setHasUnread(getHasUnread());
  }, []);

  const enabledSections = useMemo(() => getEnabledSections(campaign ?? undefined), [campaign]);
  const enabledSet = useMemo(() => new Set(enabledSections), [enabledSections]);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const isAllEnabled = campaign?.enabledSections == null;

  // Parent→child: disabling parent also disables its *_types child
  const CHILDREN: Partial<Record<CampaignSection, CampaignSection>> = {
    species: 'species_types',
    locations: 'location_types',
    groups: 'group_types',
  };

  const toggleSection = (section: CampaignSection) => {
    if (!campaign) return;
    let next: CampaignSection[];
    const child = CHILDREN[section];
    if (isAllEnabled) {
      next = ALL_SECTIONS.filter((s) => s !== section && s !== child);
    } else if (enabledSet.has(section)) {
      // Turning off — also turn off child
      next = enabledSections.filter((s) => s !== section && s !== child);
    } else {
      next = [...enabledSections, section];
    }
    updateSections(campaign.id, next);
  };

  const toggleGroup = (sectionIds: CampaignSection[]) => {
    if (!campaign) return;
    const allOn = sectionIds.every((id) => enabledSet.has(id));
    let base = isAllEnabled ? [...ALL_SECTIONS] : [...enabledSections];
    if (allOn) {
      base = base.filter((s) => !sectionIds.includes(s));
    } else {
      for (const sid of sectionIds) {
        if (!base.includes(sid)) base.push(sid);
      }
    }
    updateSections(campaign.id, base);
  };

  /** In normal mode: filter by enabled. In edit mode: show all. */
  const displayNav = useMemo(() => {
    if (editMode) return NAV;
    return NAV.map((entry) => {
      if ('section' in entry) {
        const items = entry.items.filter(
          (item) =>
            (!item.sectionId || enabledSet.has(item.sectionId)) &&
            (!item.gmOnly || isGm),
        );
        if (items.length === 0) return null;
        return { ...entry, items };
      }
      return entry;
    }).filter(Boolean) as Array<NavItem | NavSection>;
  }, [enabledSet, editMode, isGm]);


  const isActive = (to: string, exact: boolean) => {
    if (exact) return pathname === to;
    return pathname === to || pathname.startsWith(to + '/');
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col bg-surface-container-low border-r border-outline-variant/10 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-outline-variant/10 min-h-[72px]">
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="font-serif italic text-primary text-lg leading-tight block whitespace-nowrap">
              Arcane Ledger
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 block whitespace-nowrap truncate max-w-[180px]" title={campaign?.title}>
              {campaign?.title ?? 'Campaign'}
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto flex-shrink-0 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all duration-200 rounded-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-xl">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* All Campaigns */}
      <div className="px-2 pt-3 pb-1">
        <Link
          to="/campaigns"
          title={collapsed ? 'All Campaigns' : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-xs text-on-surface-variant/60 hover:bg-surface-container hover:text-on-surface transition-all duration-300"
        >
          <span className="material-symbols-outlined flex-shrink-0 text-[18px]">arrow_back</span>
          {!collapsed && <span className="whitespace-nowrap font-label uppercase tracking-widest">All Campaigns</span>}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="px-2 space-y-0.5">
          {displayNav.map((entry) => {
            if ('section' in entry) {
              const { section, sectionIds, items } = entry;
              const groupAllOn = sectionIds.every((sid) => enabledSet.has(sid));

              return (
                <li key={section}>
                  {!collapsed ? (
                    <div className="flex items-center px-3 pt-4 pb-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/35 select-none flex-1">
                        {section}
                      </p>
                      {editMode && (
                        <SectionToggle on={groupAllOn} onClick={() => toggleGroup(sectionIds)} small />
                      )}
                    </div>
                  ) : (
                    <div className="mx-3 my-3 h-px bg-outline-variant/20" />
                  )}
                  <ul className="space-y-0.5">
                    {items.map(({ label, icon, to, exact, sub, sectionId }) => {
                      const href = id ? to(id) : '#';
                      const active = id ? isActive(href, exact) : false;
                      const isOn = !sectionId || enabledSet.has(sectionId);
                      const dimmed = editMode && !isOn;

                      return (
                        <li key={label} className={dimmed ? 'opacity-40' : ''}>
                          <div className="flex items-center">
                            <Link
                              to={editMode ? '#' : href}
                              onClick={editMode ? (e) => e.preventDefault() : undefined}
                              title={collapsed ? label : undefined}
                              className={`flex-1 flex items-center gap-3 rounded-sm transition-all duration-200 font-medium ${
                                sub
                                  ? `px-3 py-1.5 ${collapsed ? '' : 'pl-9'} text-xs`
                                  : 'px-3 py-2.5 text-sm'
                              } ${
                                active && !editMode
                                  ? 'text-primary font-bold border-r-2 border-primary bg-gradient-to-r from-primary/10 to-transparent'
                                  : 'text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface'
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined flex-shrink-0 ${active && !editMode ? 'text-primary' : ''}`}
                                style={{ fontSize: sub ? '16px' : '20px' }}
                              >
                                {icon}
                              </span>
                              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                            </Link>
                            {editMode && !collapsed && sectionId && (
                              <div className="pr-3">
                                <SectionToggle on={isOn} onClick={() => toggleSection(sectionId)} small />
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }
            // Top-level item (Dashboard)
            const { label, icon, to, exact } = entry;
            const href = id ? to(id) : '#';
            const active = id ? isActive(href, exact) : false;
            return (
              <li key={label}>
                <Link
                  to={editMode ? '#' : href}
                  onClick={editMode ? (e) => e.preventDefault() : undefined}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 text-sm font-medium ${
                    active && !editMode
                      ? 'text-primary font-bold border-r-2 border-primary bg-gradient-to-r from-primary/10 to-transparent'
                      : 'text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex-shrink-0 ${active && !editMode ? 'text-primary' : ''}`}
                    style={{ fontSize: '20px' }}
                  >
                    {icon}
                  </span>
                  {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-outline-variant/10 px-2 py-3 space-y-0.5">
        {/* Edit Sections (GM only) */}
        {isGm && !collapsed && (
          <button
            onClick={() => setEditMode(!editMode)}
            title="Toggle section editing"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all duration-300 ${
              editMode
                ? 'text-primary bg-primary/10 font-medium'
                : 'text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
              {editMode ? 'check' : 'tune'}
            </span>
            <span className="whitespace-nowrap">{editMode ? 'Done' : 'Edit Sections'}</span>
          </button>
        )}
        {isGm && collapsed && (
          <button
            onClick={() => { if (collapsed) toggleSidebar(); setEditMode(!editMode); }}
            title="Edit Sections"
            className="w-full flex items-center justify-center py-2.5 rounded-sm text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
          </button>
        )}

        {/* What's New */}
        <button
          onClick={() => { setChangelogOpen(true); setHasUnread(false); }}
          title={collapsed ? "What's New" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface transition-all duration-300 relative"
        >
          <span className="relative flex-shrink-0">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>new_releases</span>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </span>
          {!collapsed && <span className="whitespace-nowrap">What's New</span>}
        </button>

      </div>

      {createPortal(
        <ChangelogDrawer
          open={changelogOpen}
          onClose={() => setChangelogOpen(false)}
        />,
        document.body,
      )}
    </aside>
  );
}
