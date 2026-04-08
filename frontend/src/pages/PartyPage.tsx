/**
 * PartyPage — thin orchestrator (Tier 2 list/admin page).
 *
 * Reads the campaign id, loads the party data via usePartyPage, and composes
 * the party section widgets:
 *
 *   - PartyHeroSection                    — header card with invite/add CTAs
 *   - PartyMyCharacterSection             — "my character" card for players
 *   - PartyPendingInvitationsSection      — pending invitations with cancel
 *   - PartyMembersSection                 — member rows with kick/assign/unlink
 *   - PartyUnassignedCharactersSection    — characters not linked to any player
 *   - PartyEmptyStateSection              — shown when everything is empty
 *
 * The CharacterEditDrawer is rendered at the page level because its open state
 * is shared between the hero CTA, the empty-state CTA, and the per-member
 * "create character" button.
 */
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { SectionBackground, SectionDisabled } from '@/shared/ui';
import { CharacterEditDrawer } from '@/features/characters/ui';
import { usePartyPage } from '@/features/characters/hooks/usePartyPage';
import {
  PartyHeroSection,
  PartyEmptyStateSection,
  PartyMyCharacterSection,
  PartyMembersSection,
  PartyPendingInvitationsSection,
  PartyUnassignedCharactersSection,
} from '@/features/characters/sections';

export default function PartyPage() {
  const { t } = useTranslation('party');
  const { id: campaignId } = useParams<{ id: string }>();
  const cId = campaignId ?? '';

  const page = usePartyPage(cId);
  const {
    campaignTitle,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    mySlot,
    otherSlots,
    invitationSlots,
    unassignedCharacters,
    membersWithoutCharacter,
    isEmpty,
    invitePanelOpen,
    setInvitePanelOpen,
    addCharOpen,
    createForUserId,
    openAddCharacter,
    closeAddCharacter,
  } = page;

  if (!partyEnabled) {
    return <SectionDisabled campaignId={cId} />;
  }

  return (
    <>
      <SectionBackground />
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        {/* Campaign name */}
        <div className="flex justify-center pt-0 pb-8">
          <Link
            to={`/campaigns/${cId}`}
            className="flex items-center gap-2 px-5 py-2 bg-surface-container border border-outline-variant/20 rounded-sm shadow-lg text-sm font-label uppercase tracking-[0.2em] text-on-surface-variant/60 hover:text-primary hover:border-primary/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">shield</span>
            {campaignTitle ?? t('common:campaign')}
          </Link>
        </div>

        {/* Content — single max-width container */}
        <div className="px-4 sm:px-8 max-w-5xl mx-auto w-full pb-20">
          <PartyHeroSection
            campaignId={cId}
            isGm={isGm}
            invitePanelOpen={invitePanelOpen}
            onToggleInvitePanel={() => setInvitePanelOpen(!invitePanelOpen)}
            onCloseInvitePanel={() => setInvitePanelOpen(false)}
            onAddCharacter={() => openAddCharacter()}
          />

          {isLoading && (
            <div className="flex items-center gap-3 p-12 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">
                progress_activity
              </span>
              {t('loading')}
            </div>
          )}
          {isError && <p className="text-tertiary text-sm p-12">{t('error')}</p>}

          {!isLoading && !isError && (
            <>
              {isEmpty && (
                <PartyEmptyStateSection
                  isGm={isGm}
                  onInvitePlayer={() => setInvitePanelOpen(true)}
                  onCreateCharacter={() => openAddCharacter()}
                />
              )}

              {!isEmpty && (
                <div className="space-y-8">
                  {mySlot?.character && (
                    <PartyMyCharacterSection
                      campaignId={cId}
                      character={mySlot.character}
                    />
                  )}

                  <PartyPendingInvitationsSection
                    invitations={invitationSlots}
                    isGm={isGm}
                  />

                  <PartyMembersSection
                    slots={otherSlots}
                    campaignId={cId}
                    unassignedCharacters={unassignedCharacters}
                    isGm={isGm}
                    onCreateCharacter={(forUserId) => openAddCharacter(forUserId)}
                  />

                  <PartyUnassignedCharactersSection
                    characters={unassignedCharacters}
                    campaignId={cId}
                    membersWithoutCharacter={membersWithoutCharacter}
                    isGm={isGm}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <CharacterEditDrawer
        open={addCharOpen}
        onClose={closeAddCharacter}
        campaignId={cId}
        forUserId={createForUserId ?? undefined}
      />
    </>
  );
}
