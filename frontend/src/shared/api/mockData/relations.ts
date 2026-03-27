import type { Relation } from '@/entities/relation';

export const MOCK_RELATIONS: Relation[] = [

  // ════════════════════════════════════════════════════════════
  //  FARCHESTER CAMPAIGN
  // ════════════════════════════════════════════════════════════

  // Party → Stoungriv
  {
    id: 'rel-alvin-stoungriv',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'character', id: 'char-alvin' },
    toEntity: { type: 'npc', id: 'npc-stoungriv' },
    friendliness: -40,
    note: 'Paid us to do his dirty work. Not fully trusted.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'rel-stoungriv-alvin',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-stoungriv' },
    toEntity: { type: 'character', id: 'char-alvin' },
    friendliness: 0,
    note: 'Useful tools, for now.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Party → Kronheyv
  {
    id: 'rel-alvin-kronheyv',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'character', id: 'char-alvin' },
    toEntity: { type: 'npc', id: 'npc-kronheyv' },
    friendliness: -80,
    note: 'Oppressive authority. Dislikes us on principle.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'rel-kronheyv-alvin',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-kronheyv' },
    toEntity: { type: 'character', id: 'char-alvin' },
    friendliness: -40,
    note: 'Outsiders. Watching closely.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Kronheyv ↔ Stoungriv
  {
    id: 'rel-kronheyv-stoungriv',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-kronheyv' },
    toEntity: { type: 'npc', id: 'npc-stoungriv' },
    friendliness: -40,
    note: 'Necessary underling. Suspected of disloyalty.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'rel-stoungriv-kronheyv',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-stoungriv' },
    toEntity: { type: 'npc', id: 'npc-kronheyv' },
    friendliness: -80,
    note: 'Authority I must outmanoeuvre, not defy openly.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Tuts ↔ Stoungriv
  {
    id: 'rel-tuts-stoungriv',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-tuts' },
    toEntity: { type: 'npc', id: 'npc-stoungriv' },
    friendliness: 40,
    note: 'An old arrangement. Mutual interest.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Party → Tuts
  {
    id: 'rel-esme-tuts',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'character', id: 'char-esme' },
    toEntity: { type: 'npc', id: 'npc-tuts' },
    friendliness: 40,
    note: 'Helped Gwilym. The mage was impressed.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Yorvert → Mirian
  {
    id: 'rel-yorvert-mirian',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-yorvert' },
    toEntity: { type: 'npc', id: 'npc-mirian' },
    friendliness: 80,
    note: 'His daughter. Everything.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Elarwen → Kronheyv
  {
    id: 'rel-elarwen-kronheyv',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'npc', id: 'npc-elarwen' },
    toEntity: { type: 'npc', id: 'npc-kronheyv' },
    friendliness: -80,
    note: 'Responsible for the pollution killing the forest.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },

  // Groups: Blue ↔ Red
  {
    id: 'rel-group-blue-red',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'group', id: 'faction-fc-blue' },
    toEntity: { type: 'group', id: 'faction-fc-red' },
    friendliness: -80,
    note: 'Open political rivalry. Cold war within city walls.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: 'rel-group-red-blue',
    campaignId: 'campaign-farchester',
    fromEntity: { type: 'group', id: 'faction-fc-red' },
    toEntity: { type: 'group', id: 'faction-fc-blue' },
    friendliness: -80,
    note: 'Disloyal faction that undermines martial law.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];
