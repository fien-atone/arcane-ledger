/**
 * PartyEmptyStateSection — empty-state card for the Party page.
 *
 * Shown when there are no members, invitations, or unassigned characters.
 * For GMs, offers inline shortcuts to invite a player or create a character.
 */
import { useTranslation } from 'react-i18next';
import { EmptyState, SectionPanel } from '@/shared/ui';

interface Props {
  isGm: boolean;
  onInvitePlayer: () => void;
  onCreateCharacter: () => void;
}

export function PartyEmptyStateSection({
  isGm,
  onInvitePlayer,
  onCreateCharacter,
}: Props) {
  const { t } = useTranslation('party');

  return (
    <SectionPanel>
      <div className="flex flex-col items-center justify-center py-8">
        <EmptyState
          icon="groups"
          title={t('empty_title')}
          subtitle={t('empty_subtitle')}
        />
        {isGm && (
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onInvitePlayer}
              className="flex items-center gap-2 px-5 py-2.5 text-secondary border border-secondary/30 rounded-sm text-xs font-label uppercase tracking-widest hover:bg-secondary/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              {t('invite_player')}
            </button>
            <button
              onClick={onCreateCharacter}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-sm text-xs font-label uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              {t('create_character')}
            </button>
          </div>
        )}
      </div>
    </SectionPanel>
  );
}
