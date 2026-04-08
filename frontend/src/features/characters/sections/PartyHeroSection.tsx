/**
 * PartyHeroSection — header card for the Party page.
 *
 * Renders the title, subtitle, and (for GMs) the "invite player" and
 * "add character" call-to-action buttons. When the invite panel is toggled
 * open, the shared InvitePanel is mounted inside the same card.
 */
import { useTranslation } from 'react-i18next';
import { InvitePanel } from '@/features/invitations/ui/InvitePanel';

interface Props {
  campaignId: string;
  isGm: boolean;
  invitePanelOpen: boolean;
  onToggleInvitePanel: () => void;
  onCloseInvitePanel: () => void;
  onAddCharacter: () => void;
}

export function PartyHeroSection({
  campaignId,
  isGm,
  invitePanelOpen,
  onToggleInvitePanel,
  onCloseInvitePanel,
  onAddCharacter,
}: Props) {
  const { t } = useTranslation('party');

  return (
    <div className="bg-surface-container border border-outline-variant/20 rounded-sm p-6 mb-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-headline text-3xl sm:text-4xl font-bold text-on-surface tracking-tight">
            {t('title')}
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">{t('subtitle')}</p>
        </div>
        {isGm && (
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleInvitePanel}
              className="flex items-center gap-2 px-5 py-2.5 text-secondary border border-secondary/30 rounded-sm text-xs font-label uppercase tracking-widest hover:bg-secondary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              {t('invite_player')}
            </button>
            <button
              onClick={onAddCharacter}
              className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-2.5 rounded-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span className="font-label text-xs uppercase tracking-widest">
                {t('add_character')}
              </span>
            </button>
          </div>
        )}
      </div>
      {invitePanelOpen && isGm && (
        <div className="mt-4">
          <InvitePanel campaignId={campaignId} onClose={onCloseInvitePanel} />
        </div>
      )}
    </div>
  );
}
