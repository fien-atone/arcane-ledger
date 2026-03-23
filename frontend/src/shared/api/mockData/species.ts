import type { Species } from '@/entities/species';

export const MOCK_SPECIES: Species[] = [
  {
    id: 'species-human',
    name: 'Human',
    pluralName: 'Humans',
    type: 'humanoid',
    size: 'medium',
    description:
      'Humans are the most widespread and adaptable of the common races. Their ambition, diversity, and short lifespans drive them to achieve remarkable things within a single generation.',
    traits: ['Versatile', 'Ambitious', 'Adaptable'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-elf',
    name: 'Elf',
    pluralName: 'Elves',
    type: 'humanoid',
    size: 'medium',
    description:
      'Elves are a magical people of otherworldly grace, long-lived and deeply tied to nature and the arcane. They remember centuries of history and change slowly, if at all.',
    traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-dwarf',
    name: 'Dwarf',
    pluralName: 'Dwarves',
    type: 'humanoid',
    size: 'medium',
    description:
      'Dwarves are a hardy, stoic people forged in the deep places of the world. Their traditions run deep, their grudges longer still, and their craftsmanship unmatched.',
    traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-halfling',
    name: 'Halfling',
    pluralName: 'Halflings',
    type: 'humanoid',
    size: 'small',
    description:
      'Halflings are small, practical folk who possess a remarkable talent for luck and an easy-going nature that belies a fierce determination when their homes and loved ones are threatened.',
    traits: ['Lucky', 'Brave', 'Nimbleness'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-gnome',
    name: 'Gnome',
    pluralName: 'Gnomes',
    type: 'humanoid',
    size: 'small',
    description:
      'Gnomes are quick-witted, inventive, and curious beyond measure. Their small stature belies their sharp minds and their long lives give them centuries to indulge every fascination.',
    traits: ['Darkvision', 'Gnome Cunning'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-half-elf',
    name: 'Half-Elf',
    pluralName: 'Half-Elves',
    type: 'humanoid',
    size: 'medium',
    description:
      'Half-elves combine the best qualities of their human and elven heritage, possessing elven grace and human ambition. They often find themselves caught between two worlds, belonging fully to neither.',
    traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-half-orc',
    name: 'Half-Orc',
    pluralName: 'Half-Orcs',
    type: 'humanoid',
    size: 'medium',
    description:
      'Half-orcs inherit physical power from their orc heritage and determination from their human side. Often judged before they are known, they must prove themselves through deeds rather than words.',
    traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-tiefling',
    name: 'Tiefling',
    pluralName: 'Tieflings',
    type: 'humanoid',
    size: 'medium',
    description:
      'Tieflings bear the infernal mark of fiendish ancestry, branded by the sins of the past. Distrusted and feared by many, they often walk a lonely road — but their arcane gifts and fierce willpower make them formidable.',
    traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-dragonborn',
    name: 'Dragonborn',
    pluralName: 'Dragonborn',
    type: 'humanoid',
    size: 'medium',
    description:
      'Born of draconic lineage, dragonborn carry within them the power of dragons — breath weapons, scales, and an inborn pride in their heritage. Honour and clan are paramount to their culture.',
    traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'species-goblin',
    name: 'Goblin',
    pluralName: 'Goblins',
    type: 'humanoid',
    size: 'small',
    description:
      'Small and cunning, goblins are survivors who make the most of meager resources. Often found in tight-knit warrens, they can be fierce warriors, clever tricksters, or surprisingly capable shamans.',
    traits: ['Darkvision', 'Nimble Escape', 'Fury of the Small'],
    createdAt: '2025-01-01T00:00:00Z',
  },
];
