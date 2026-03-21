import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';

const NAV_ITEMS = [
  { label: 'Library', to: '/campaigns', icon: 'auto_stories' },
  { label: 'Chronicles', to: null, icon: 'history_edu' },
  { label: 'Sanctum', to: null, icon: 'fort' },
] as const;

export function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '?';

  return (
    <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-50 bg-surface shadow-[0_16px_32px_-12px_rgba(227,226,232,0.04)] border-b border-outline-variant/10">
      {/* Left: logo + nav */}
      <div className="flex items-center gap-8">
        <Link
          to="/campaigns"
          className="text-2xl font-serif italic text-primary tracking-tight hover:text-primary-fixed transition-colors"
        >
          Arcane Ledger
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map(({ label, to }) => {
            const isActive = to !== null && pathname.startsWith(to);
            const baseClass =
              'font-label text-sm uppercase tracking-widest transition-colors duration-300 pb-1';
            if (to === null) {
              return (
                <span
                  key={label}
                  className={`${baseClass} text-on-surface-variant/30 cursor-not-allowed select-none`}
                >
                  {label}
                </span>
              );
            }
            return (
              <Link
                key={label}
                to={to}
                className={
                  isActive
                    ? `${baseClass} text-primary border-b-2 border-primary`
                    : `${baseClass} text-on-surface-variant hover:text-on-surface`
                }
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: search + actions + avatar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">search</span>
          <input
            className="bg-transparent border-none outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 w-40"
            placeholder="Search archives..."
          />
        </div>

        {/* Notifications */}
        <button className="p-2 text-on-surface-variant hover:bg-surface-container transition-colors rounded-sm">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="w-9 h-9 rounded-full bg-surface-container-high border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm hover:border-primary/60 transition-colors"
          >
            {initials}
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-11 w-52 bg-surface-container-high border border-outline-variant/20 rounded-sm shadow-2xl py-1 z-50">
              <div className="px-4 py-3 border-b border-outline-variant/10">
                <p className="text-on-surface text-sm font-medium">{user?.name}</p>
                <p className="text-on-surface-variant text-xs truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
