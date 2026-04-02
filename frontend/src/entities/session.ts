export interface Session {
  id: string;
  campaignId: string;
  number: number;
  title: string;
  datetime: string;
  brief?: string;
  summary: string;
  locationIds?: string[];
  npcIds?: string[];
  questIds?: string[];
  npcs?: { id: string; name: string; status?: string; species?: string; image?: string }[];
  locations?: { id: string; name: string; type?: string }[];
  quests?: { id: string; title: string; status?: string }[];
  playerVisible?: boolean;
  playerVisibleFields?: string[];
  myNote?: { id: string; content: string; updatedAt: string };
  createdAt: string;
}
