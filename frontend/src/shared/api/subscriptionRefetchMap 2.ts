/**
 * Maps backend entityType strings to Apollo Client query operation names.
 * When a subscription event arrives, we refetch all active queries whose
 * operation name appears in the corresponding array.
 *
 * Operation names MUST match the `query OperationName(...)` in each queries.ts file.
 */
export const REFETCH_MAP: Record<string, string[]> = {
  NPC:                    ['Npcs', 'Npc', 'Sessions'],
  SESSION:                ['Sessions', 'Quests', 'Quest'],
  SESSION_NOTE:           ['Sessions'],
  LOCATION:               ['Locations', 'Location', 'Sessions'],
  QUEST:                  ['Quests', 'Quest', 'Sessions'],
  GROUP:                  ['Groups', 'Group'],
  RELATION:               ['RelationsForCampaign', 'RelationsForEntity'],
  CHARACTER:              ['Party', 'PartySlots'],
  SPECIES:                ['Species'],
  CAMPAIGN:               ['Campaign', 'Campaigns'],
  NPC_MEMBERSHIP:         ['Npcs', 'Npc', 'Groups', 'Group'],
  NPC_PRESENCE:           ['Npcs', 'Npc', 'Locations', 'Location'],
  CHARACTER_MEMBERSHIP:   ['Party', 'Groups', 'Group'],
  LOCATION_TYPE:          ['LocationTypes'],
  GROUP_TYPE:             ['GroupTypes'],
  SPECIES_TYPE:           ['SpeciesTypes'],
  CONTAINMENT_RULE:       ['ContainmentRules'],
  MEMBER:                 ['PartySlots', 'Party', 'CampaignInvitations'],
  INVITATION:             ['MyInvitations', 'CampaignInvitations', 'PartySlots', 'Campaigns'],
};
