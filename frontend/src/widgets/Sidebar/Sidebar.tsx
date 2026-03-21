import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useCampaignUiStore } from '@/features/campaigns/model/store';
import { useAuthStore } from '@/features/auth';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', to: (id: string) => `/campaigns/${id}`, exact: true },
  { label: 'NPCs', icon: 'group', to: (id: string) => `/campaigns/${id}/npcs`, exact: false },
  { label: 'Locations', icon: 'location_on', to: (id: string) => `/campaigns/${id}/locations`, exact: false },
  { label: 'Groups', icon: 'groups', to: (id: string) => `/campaigns/${id}/groups`, exact: false },
  { label: 'Quests', icon: 'assignment', to: (id: string) => `/campaigns/${id}/quests`, exact: false },
  { label: 'Sessions', icon: 'event', to: (id: string) => `/campaigns/${id}/sessions`, exact: false },
  { label: 'Party', icon: 'groups', to: (id: string) => `/campaigns/${id}/party`, exact: false },
  { label: 'Materials', icon: 'menu_book', to: (id: string) => `/campaigns/${id}/materials`, exact: false },
] as const;

export function Sidebar() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const collapsed = useCampaignUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useCampaignUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);

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
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, icon, to, exact }) => {
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
                      : 'text-on-surface-variant opacity-80 hover:bg-surface-container hover:text-on-surface transition-all duration-300'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined flex-shrink-0 ${
                      active ? 'text-primary' : ''
                    }`}
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
    </aside>
  );
}
