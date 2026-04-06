import { useState } from 'react';
import { useSubscription } from '@apollo/client/react';
import { useMyInvitations, useRespondToInvitation } from '@/features/invitations/api/queries';
import { useAuthStore } from '@/features/auth';
import { USER_EVENT_SUBSCRIPTION } from '@/shared/api/subscriptions';
import { D20Icon } from '@/shared/ui';

function timeAgo(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const ts = new Date(dateStr).getTime();
  if (isNaN(ts)) return '';
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function InvitationBanner() {
  const { data: invitations, isLoading, refetch } = useMyInvitations();
  const userId = useAuthStore((s) => s.user?.id);

  // Subscribe to user events so new invitations appear in real-time
  useSubscription<{ userEvent: { type: string; entityId: string } }>(USER_EVENT_SUBSCRIPTION, {
    variables: { userId: userId ?? '' },
    skip: !userId,
    onData: ({ data }) => {
      const event = data.data?.userEvent;
      if (event?.type?.startsWith('INVITATION') || event?.type === 'MEMBER_REMOVED') {
        refetch();
      }
    },
  });
  const respond = useRespondToInvitation();
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const pending = invitations.filter((inv) => inv.status === 'pending');

  if (isLoading || pending.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-sm font-label font-bold tracking-[0.2em] uppercase text-secondary whitespace-nowrap">
          Invitations
        </h2>
        <div className="h-px flex-1 bg-outline-variant/20" />
        <span className="text-[10px] text-on-surface-variant/30">{pending.length}</span>
      </div>
      <div className="space-y-3">
        {pending.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-4 p-5 bg-surface-container border border-secondary/30 rounded-sm"
          >
            <D20Icon className="w-8 h-8 text-secondary/60 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-on-surface truncate">
                {inv.campaign?.title ?? 'Campaign'}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {inv.invitedBy.name} invited you{' '}
                <span className="text-on-surface-variant/40">{timeAgo(inv.createdAt)}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {decliningId === inv.id ? (
                <>
                  <span className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">Decline?</span>
                  <button
                    onClick={() => {
                      respond.mutate({ id: inv.id, accept: false });
                      setDecliningId(null);
                    }}
                    className="px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-tertiary border border-tertiary/30 rounded-sm hover:bg-tertiary/10 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDecliningId(null)}
                    className="px-3 py-1.5 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    No
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => respond.mutate({ id: inv.id, accept: true })}
                    disabled={respond.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary text-[10px] font-label uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    Accept
                  </button>
                  <button
                    onClick={() => setDecliningId(inv.id)}
                    className="px-4 py-2 text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Decline
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
