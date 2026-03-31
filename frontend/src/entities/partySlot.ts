import type { PlayerCharacter } from './character';
import type { CampaignInvitation } from './invitation';

export interface PartySlot {
  member?: {
    id: string;
    user: { id: string; name: string; email: string; avatar?: string };
    role: string;
    joinedAt: string;
  };
  character?: PlayerCharacter;
  invitation?: CampaignInvitation;
}
