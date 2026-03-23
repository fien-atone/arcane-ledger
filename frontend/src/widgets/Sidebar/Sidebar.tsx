import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCampaignUiStore } from '@/features/campaigns/model/store';
import { useAuthStore } from '@/features/auth';
import { ChangelogDrawer, getHasUnread } from '@/widgets/Changelog/ChangelogDrawer';

interface NavItem {
  label: string;
  icon: string;
  to: (id: string) => string;
  exact: boolean;
  sub?: boolean;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV: Array<NavItem | NavSection> = [
  { label: 'Dashboard', icon: 'dashboard', to: (id) => `/campaigns/${id}`, exact: true },
  {
    section: 'World',
    items: [
      { label: 'Locations', icon: 'location_on', to: (id) => `/campaigns/${id}/locations`, exact: false },
      { label: 'NPCs', icon: 'group', to: (id) => `/campaigns/${id}/npcs`, exact: false },
      { label: 'Species', icon: 'blur_on', to: (id) => `/campaigns/${id}/species`, exact: false },
      { label: 'Groups', icon: 'groups', to: (id) => `/campaigns/${id}/groups`, exact: false },
      { label: 'Group Types', icon: 'category', to: (id) => `/campaigns/${id}/group-types`, exact: false, sub: true },
    ],
  },
  {
    section: 'Adventure',
    items: [
      { label: 'Sessions', icon: 'event', to: (id) => `/campaigns/${id}/sessions`, exact: false },
      { label: 'Party', icon: 'shield_person', to: (id) => `/campaigns/${id}/party`, exact: false },
      { label: 'Quests', icon: 'assignment', to: (id) => `/campaigns/${id}/quests`, exact: false },
    ],
  },
  {
    section: 'GM Screen',
    items: [
      { label: 'Materials', icon: 'menu_book', to: (id) => `/campaigns/${id}/materials`, exact: false },
    ],
  },
];

export function Sidebar() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const collapsed = useCampaignUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useCampaignUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);

  const [changelogOpen, setChangelogOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setHasUnread(getHasUnread());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

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
            <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60 block whitespace-nowrap">
              The Ledger of Fates
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

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <ul className="px-2 space-y-0.5">
          {NAV.map((entry) => {
            if ('section' in entry) {
              const { section, items } = entry;
              return (
                <li key={section}>
                  {/* Section header */}
                  {!collapsed ? (
                    <p className="px-3 pt-4 pb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/35 select-none">
                      {section}
                    </p>
                  ) : (
                    <div className="mx-3 my-3 h-px bg-outline-variant/20" />
                  )}
                  <ul className="space-y-0.5">
                    {items.map(({ label, icon, to, exact, sub }) => {
                      const href = id ? to(id) : '#';
                      const active = id ? isActive(href, exact) : false;
                      return (
                        <li key={label}>
                          <Link
                            to={href}
                            title={collapsed ? label : undefined}
                            className={`flex items-center gap-3 rounded-sm transition-all duration-200 font-medium ${
                              sub
                                ? `px-3 py-1.5 ${collapsed ? '' : 'pl-9'} text-xs`
                                : 'px-3 py-2.5 text-sm'
                            } ${
                              active
                                ? 'text-primary font-bold border-r-2 border-primary bg-gradient-to-r from-primary/10 to-transparent'
                                : 'text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined flex-shrink-0 ${active ? 'text-primary' : ''}`}
                              style={{ fontSize: sub ? '16px' : '20px' }}
                            >
                              {icon}
                            </span>
                            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
                          </Link>
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
                  to={href}
                  title={collapsed ? label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 text-sm font-medium ${
                    active
                      ? 'text-primary font-bold border-r-2 border-primary bg-gradient-to-r from-primary/10 to-transparent'
                      : 'text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex-shrink-0 ${active ? 'text-primary' : ''}`}
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
        <Link
          to="/campaigns"
          title={collapsed ? 'All Campaigns' : undefined}
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface transition-all duration-300"
        >
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
            auto_stories
          </span>
          {!collapsed && <span className="whitespace-nowrap">All Campaigns</span>}
        </Link>

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

        <div className="border-t border-outline-variant/10 my-1" />

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface transition-all duration-300"
        >
          <span className="material-symbols-outlined flex-shrink-0" style={{ fontSize: '20px' }}>
            logout
          </span>
          {!collapsed && <span className="whitespace-nowrap">Logout</span>}
        </button>
      </div>

      <ChangelogDrawer
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
      />
    </aside>
  );
}
