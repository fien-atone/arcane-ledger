import { useState, useEffect, useRef } from 'react';
import { useSearchUsers, useInvitePlayer } from '@/features/invitations/api/queries';

interface Props {
  campaignId: string;
  onClose: () => void;
}

export function InvitePanel({ campaignId, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const invite = useInvitePlayer();

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const { data: users, isLoading } = useSearchUsers(campaignId, debouncedSearch);

  return (
    <div className="border border-secondary/20 bg-secondary/5 rounded-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-label font-bold uppercase tracking-widest text-secondary">
          Invite Player
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-on-surface-variant/40 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="relative mb-3">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[16px]">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2.5 bg-surface-container border border-outline-variant/25 focus:border-secondary rounded-sm text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30"
        />
      </div>

      {debouncedSearch.length >= 2 && (
        <div className="max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center gap-2 py-4 px-2 text-on-surface-variant/40 text-xs">
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              Searching...
            </div>
          )}

          {!isLoading && users.length === 0 && (
            <p className="py-4 px-2 text-xs text-on-surface-variant/40 italic">
              No users found matching "{debouncedSearch}"
            </p>
          )}

          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low rounded-sm transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-on-surface-variant/60">
                  {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant/50 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => invite.mutate({ campaignId, userId: user.id })}
                disabled={invite.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-secondary border border-secondary/30 rounded-sm hover:bg-secondary/10 transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                Invite
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
