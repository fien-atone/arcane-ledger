/**
 * PartyPendingInvitationsSection — list of pending campaign invitations.
 *
 * Each row shows the invited user's name + email and a pending badge.
 * For GMs, an inline cancel confirm flow lets them revoke the invitation.
 * The cancel mutation lives inside this section — no parent plumbing.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCancelInvitation } from '@/features/invitations/api/queries';
import { SectionPanel } from '@/shared/ui';
import type { CampaignInvitation } from '@/entities/invitation';

interface Props {
  invitations: CampaignInvitation[];
  isGm: boolean;
}

export function PartyPendingInvitationsSection({ invitations, isGm }: Props) {
  const { t } = useTranslation('party');
  const cancelInvitation = useCancelInvitation();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  return (
    <SectionPanel
      size="sm"
      title={t('section_pending_invitations')}
      action={<span className="text-[10px] text-on-surface-variant/30">{invitations.length}</span>}
    >
      <div className="space-y-2">
        {invitations.map((inv) => {
          const isConfirming = confirmingId === inv.id;
          return (
            <div
              key={inv.id}
              className="flex items-center gap-3 p-4 border border-outline-variant/10 bg-surface-container-low rounded-sm"
            >
              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/40">
                  hourglass_top
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface font-medium truncate">
                  {inv.user.name}
                </p>
                <p className="text-[10px] text-on-surface-variant/50 truncate">
                  {inv.user.email}
                </p>
              </div>
              <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-secondary bg-secondary/10 border border-secondary/20 rounded-full">
                {t('status_pending')}
              </span>
              {isGm && (
                <div className="flex-shrink-0">
                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-on-surface-variant/50">
                        {t('cancel_confirm')}
                      </span>
                      <button
                        onClick={() => {
                          cancelInvitation.mutate(inv.id);
                          setConfirmingId(null);
                        }}
                        className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-tertiary border border-tertiary/30 rounded-sm hover:bg-tertiary/10"
                      >
                        {t('confirm_yes')}
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="px-2 py-1 text-[9px] font-label uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
                      >
                        {t('confirm_no')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(inv.id)}
                      className="p-1.5 text-on-surface-variant/30 hover:text-tertiary transition-colors"
                      title={t('cancel_invitation')}
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionPanel>
  );
}
