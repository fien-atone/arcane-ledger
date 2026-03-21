import type { CampaignSummary } from '@/entities/campaign';

export const MOCK_CAMPAIGNS: CampaignSummary[] = [
  {
    id: 'campaign-farchester',
    title: 'Farchester',
    description:
      'City intrigue under a dry law and curfew. 5000 gold missing from the treasury. ' +
      'Goblins at the eastern gate, elves at the western. The party operates undercover.',
    createdAt: '2026-02-01T00:00:00Z',
    sessionCount: 5,
    memberCount: 6,
    lastSession: {
      title: "Session 5 — Gnurk's Mold, Brewing with Yorvert",
      datetime: '2026-03-18T18:00:00Z',
    },
    myRole: 'gm',
    coverGradient:
      'linear-gradient(135deg, #0a1628 0%, #1a2744 40%, #0d2233 70%, #121317 100%)',
  },
  {
    id: 'campaign-drakkenheim',
    title: 'Drakkenheim',
    description:
      'A ruined city blanketed in deliriite. Five factions fight for control. ' +
      'The party navigates the underground district of Bent Row and the delirium-soaked streets above.',
    createdAt: '2025-09-01T00:00:00Z',
    sessionCount: 17,
    memberCount: 5,
    lastSession: {
      title: 'Session 17 — Aldor, Doppelganger, Escape',
      datetime: '2026-03-16T18:00:00Z',
    },
    myRole: 'gm',
    coverGradient:
      'linear-gradient(135deg, #1a0a2e 0%, #3b1255 40%, #2a0d1e 70%, #121317 100%)',
  },
];
