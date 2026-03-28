import type { GroupTypeEntry } from '@/entities/groupType';

export const GROUP_TYPES_SEED: GroupTypeEntry[] = [
  { campaignId: '', id: 'faction',  name: 'Faction',          icon: 'flag',             description: 'Political or military powers vying for control.',          createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'guild',    name: 'Guild',             icon: 'handshake',        description: 'Professional organisations united by trade or craft.',     createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'family',   name: 'Family',            icon: 'family_restroom',  description: 'Blood-related or adopted kin.',                            createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'religion', name: 'Religion',          icon: 'auto_awesome',     description: 'Faiths, cults, and divine orders.',                       createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'criminal', name: 'Criminal Org.',     icon: 'warning',          description: 'Underworld syndicates and illicit networks.',              createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'military', name: 'Military / Order',  icon: 'military_tech',    description: 'Armed forces, knightly orders, and mercenary companies.',  createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'academy',  name: 'Academy',           icon: 'school',           description: 'Institutions of learning and magical research.',           createdAt: '2026-01-01T00:00:00Z' },
  { campaignId: '', id: 'secret',   name: 'Secret Society',    icon: 'visibility_off',   description: 'Hidden organisations operating in the shadows.',           createdAt: '2026-01-01T00:00:00Z' },
];
