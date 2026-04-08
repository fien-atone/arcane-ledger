/**
 * Page-level state and data for PartyPage (Tier 2 list/admin page).
 *
 * Loads:
 * - The campaign (for the title and role check)
 * - The party slots (members + linked characters)
 * - The campaign invitations (pending)
 * - The full character list (to compute unassigned)
 *
 * Derives:
 * - isGm flag
 * - memberSlots / mySlot / otherSlots (players-only view split)
 * - invitationSlots (pending invitations)
 * - unassignedCharacters
 * - membersWithoutCharacter (for the unassigned -> assign dropdown)
 * - isEmpty
 *
 * Owns the drawer / invite panel state:
 * - invitePanelOpen
 * - addCharOpen + createForUserId (forUserId that will own the new character)
 *
 * Section widgets receive minimal props (already-derived lists + handlers)
 * and do not re-fetch the root data themselves — matches the list-page
 * pattern established by useLocationTypesPage.
 */
import { useState } from 'react';
import { useCampaign, useSectionEnabled } from '@/features/campaigns/api/queries';
import { useParty } from '@/features/characters/api/queries';
import {
  usePartySlots,
  useCampaignInvitations,
} from '@/features/invitations/api/queries';
import { useAuthStore } from '@/features/auth';
import type { PartySlot } from '@/entities/partySlot';
import type { PlayerCharacter } from '@/entities/character';
import type { CampaignInvitation } from '@/entities/invitation';

export interface MemberWithoutCharacter {
  userId: string;
  userName: string;
}

export interface UsePartyPageResult {
  campaignId: string;
  campaignTitle: string | undefined;
  partyEnabled: boolean;
  isGm: boolean;
  isLoading: boolean;
  isError: boolean;
  // Derived lists
  memberSlots: PartySlot[];
  mySlot: PartySlot | undefined;
  otherSlots: PartySlot[];
  invitationSlots: CampaignInvitation[];
  unassignedCharacters: PlayerCharacter[];
  membersWithoutCharacter: MemberWithoutCharacter[];
  isEmpty: boolean;
  // Drawer / panel state
  invitePanelOpen: boolean;
  setInvitePanelOpen: (v: boolean) => void;
  addCharOpen: boolean;
  createForUserId: string | null;
  openAddCharacter: (forUserId?: string) => void;
  closeAddCharacter: () => void;
}

export function usePartyPage(campaignId: string): UsePartyPageResult {
  const partyEnabled = useSectionEnabled(campaignId, 'party');
  const { data: campaign } = useCampaign(campaignId);
  const { data: slots, isLoading, isError } = usePartySlots(campaignId);
  const { data: invitations } = useCampaignInvitations(campaignId);
  const { data: characters } = useParty(campaignId);

  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [addCharOpen, setAddCharOpen] = useState(false);
  const [createForUserId, setCreateForUserId] = useState<string | null>(null);

  const isGm = campaign?.myRole?.toLowerCase() === 'gm';
  const currentUserId = useAuthStore((s) => s.user?.id);

  const memberSlots = (slots ?? []).filter((s) => s.member);
  const mySlot = !isGm
    ? memberSlots.find((s) => s.member!.user.id === currentUserId)
    : undefined;
  const otherSlots = mySlot ? memberSlots.filter((s) => s !== mySlot) : memberSlots;
  const invitationSlots = (invitations ?? []).filter((inv) => inv.status === 'pending');
  const unassignedCharacters = (characters ?? []).filter((c) => !c.userId);
  const membersWithoutCharacter: MemberWithoutCharacter[] = memberSlots
    .filter((s) => !s.character)
    .map((s) => ({
      userId: s.member!.user.id,
      userName: s.member!.user.name,
    }));

  const isEmpty =
    memberSlots.length === 0 &&
    invitationSlots.length === 0 &&
    unassignedCharacters.length === 0;

  const openAddCharacter = (forUserId?: string) => {
    setCreateForUserId(forUserId ?? null);
    setAddCharOpen(true);
  };
  const closeAddCharacter = () => {
    setAddCharOpen(false);
    setCreateForUserId(null);
  };

  return {
    campaignId,
    campaignTitle: campaign?.title,
    partyEnabled,
    isGm,
    isLoading,
    isError,
    memberSlots,
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
  };
}
