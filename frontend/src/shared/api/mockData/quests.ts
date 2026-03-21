import type { Quest } from '@/entities/quest';

export const MOCK_QUESTS: Quest[] = [
  {
    id: 'q-fc-1',
    campaignId: 'campaign-farchester',
    title: 'Find Special Alcohol for Lord-Admiral',
    description:
      'The Lord-Admiral Kronhev requested a very specific brew. The party must obtain it to gain his favour.',
    giverId: 'npc-kronheyv',
    status: 'active',
    notes: '1 bottle currently held by Evelina. Alvin broke one. May need to brew more.',
    createdAt: '2026-02-24T00:00:00Z',
  },
  {
    id: 'q-fc-2',
    campaignId: 'campaign-farchester',
    title: 'Find Gefara Order Spies',
    description:
      'The Burgher suspects agents of the Gefara Order have infiltrated Farchester.',
    giverId: 'npc-stoungriv',
    status: 'active',
    notes: 'Party has official documents from the Burgher (unsealed — just stamp and signature).',
    createdAt: '2026-02-24T00:00:00Z',
  },
  {
    id: 'q-fc-3',
    campaignId: 'campaign-farchester',
    title: 'Resolve the Protesters at the Gate',
    description:
      'Goblins and elves are demonstrating outside the city gates. The city wants it dealt with.',
    giverId: 'npc-stoungriv',
    status: 'active',
    notes:
      "Gnurk (goblin leader) wants a special mold from the city. Elves are protesting the city's waste dumping into the forest. Alvin proposed letting delegates enter freely.",
    createdAt: '2026-02-20T00:00:00Z',
  },
  {
    id: 'q-dk-1',
    campaignId: 'campaign-drakkenheim',
    title: 'Find Oscar Yoren',
    description: 'The Amethyst Academy is hiding something about Oscar Yoren.',
    status: 'unknown',
    notes: 'What are the Amethysts concealing?',
    createdAt: '2025-09-01T00:00:00Z',
  },
  {
    id: 'q-dk-2',
    campaignId: 'campaign-drakkenheim',
    title: "Decipher Copperpot's Note",
    description: "A note found on Copperpot's corpse written in an unknown language.",
    giverId: 'npc-rosa-carver',
    status: 'unknown',
    notes: '',
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'q-dk-3',
    campaignId: 'campaign-drakkenheim',
    title: 'Find Johann Ghostweaver',
    description: 'Who is Johann Ghostweaver and how is he connected to Oscar Yoren?',
    status: 'unknown',
    notes: '',
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'q-dk-4',
    campaignId: 'campaign-drakkenheim',
    title: 'Hooded Lanterns Quest — Infected Potions',
    description:
      'A quest from the Hooded Lanterns involving infected potions at the estate near Eckerman Mill.',
    giverId: 'npc-karin-alsberg',
    status: 'active',
    notes: 'Estate near Eckerman Mill. Not yet visited.',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'q-dk-5',
    campaignId: 'campaign-drakkenheim',
    title: 'Contact Black Jack',
    description:
      "Black Jack at the Hanging Lock tavern — a contact from the Queen's Men.",
    giverId: 'npc-madam-rochelle',
    status: 'active',
    notes: "Tiflings 'Deceit and Lies' mentioned Black Jack can offer work for the Queen.",
    createdAt: '2026-03-16T00:00:00Z',
  },
  {
    id: 'q-dk-6',
    campaignId: 'campaign-drakkenheim',
    title: "Retrieve Aldor's Research",
    description:
      "Aldor had collected field notes on Haze mutation patterns in the Outer City. His research was stored at the Red Lion Hotel.",
    giverId: 'npc-aldor',
    status: 'unavailable',
    notes: 'Aldor was killed by the Mind Reaper. The Red Lion is still accessible — research may still be there.',
    createdAt: '2026-02-01T00:00:00Z',
  },
];
