import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="fixed top-0 right-0 z-50" ref={dropdownRef}>
      <div className="bg-surface-container border-l border-b border-outline-variant/20 rounded-bl-lg pl-4 pr-3 py-2.5 shadow-lg flex items-center gap-3">
        <button
          onClick={() => setAvatarOpen((v) => !v)}
          className="w-9 h-9 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-primary font-semibold text-sm hover:border-primary/40 transition-colors"
        >
          {initials}
        </button>
      </div>

      {avatarOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-surface-container-high border border-outline-variant/20 rounded-sm shadow-2xl py-1 z-50">
          <div className="px-4 py-3 border-b border-outline-variant/10">
            <p className="text-on-surface text-sm font-medium">{user?.name}</p>
            <p className="text-on-surface-variant text-xs truncate">{user?.email}</p>
          </div>
          <Link
            to="/profile"
            onClick={() => setAvatarOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">person</span>
            Profile
          </Link>
          {user?.systemRole === 'admin' && (
            <Link
              to="/admin/users"
              onClick={() => setAvatarOpen(false)}
              className="w-full text-left px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">admin_panel_settings</span>
              Admin
            </Link>
          )}
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
  );
}
