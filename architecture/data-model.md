# Arcane Ledger — Data Model

> Source of truth: `backend/prisma/schema.prisma`
> This document is a human-readable summary. Always check the Prisma schema for exact field types.

---

## Entity Relationship Diagram

```
User ──── CampaignMember ──── Campaign
                                 │
          ┌──────────┬───────────┼───────────┬──────────┬──────────┐
          ▼          ▼           ▼           ▼          ▼          ▼
       Session      NPC       Quest       Group     Location   PlayerCharacter
          │          │           │           │          │
          │    NPCLocationPresence    NPCGroupMembership │
          │          │                      │          │
          └──── SessionNPC ─────────────────┘          │
          └──── SessionLocation ───────────────────────┘
          └──── SessionQuest ──────── Quest
                                       │
                                    NPC (giver)

Relation (polymorphic: npc/character/group → npc/character/group)

Global: LocationType, GroupType, Species
```

---

## Models

### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| email | String | unique |
| password | String | bcrypt hash |
| name | String | |
| avatar | String? | |

### Campaign
| Field | Type | Notes |
|---|---|---|
| id | UUID | PK |
| title | String | |
| description | String? | rich text |
| archivedAt | DateTime? | null = active |

### CampaignMember
| Field | Type | Notes |
|---|---|---|
| campaignId + userId | | unique pair |
| role | GM / PLAYER | |

### Session
| Field | Type | Notes |
|---|---|---|
| number | Int | session # |
| title | String | |
| datetime | String | ISO or empty |
| brief | String? | public description |
| summary | String | GM notes (rich text) |
| → npcs | junction | SessionNPC |
| → locations | junction | SessionLocation |
| → quests | junction | SessionQuest |

### NPC
| Field | Type | Notes |
|---|---|---|
| name | String | |
| aliases | String[] | |
| status | ALIVE/DEAD/MISSING/UNKNOWN/HOSTILE | |
| gender | MALE/FEMALE/NONBINARY | nullable |
| age | Int? | |
| species, speciesId | String? | free text + optional FK |
| appearance, personality, description, motivation, flaws | String? | rich text |
| gmNotes | String? | GM only |
| image | String? | base64 data URL |
| → locationPresences | NPCLocationPresence[] | with note |
| → groupMemberships | NPCGroupMembership[] | with relation, subfaction |

### Quest
| Field | Type | Notes |
|---|---|---|
| title | String | |
| description | String | rich text |
| giverId | → NPC? | nullable FK |
| reward | String? | rich text |
| status | ACTIVE/COMPLETED/FAILED/UNAVAILABLE/UNDISCOVERED | |
| notes | String | GM notes |

### Group
| Field | Type | Notes |
|---|---|---|
| name | String | |
| type | String | references GroupType.id |
| aliases | String[] | |
| description, goals, symbols, gmNotes | String? | |
| partyRelation | String? | allied/neutral/hostile/unknown |
| → members | NPCGroupMembership[] | |

### Location
| Field | Type | Notes |
|---|---|---|
| name | String | |
| aliases | String[] | |
| type | String | references LocationType.id |
| parentLocationId | → Location? | self-reference hierarchy |
| settlementPopulation | Int? | |
| biome | String? | |
| description, gmNotes | String? | |
| image | String? | |
| mapMarkers | Json | MapMarker[] |

### Relation (Social)
| Field | Type | Notes |
|---|---|---|
| fromEntityType + fromEntityId | String | polymorphic (npc/character/group) |
| toEntityType + toEntityId | String | polymorphic |
| friendliness | Int | -80, -40, 0, 40, 80 |
| note | String? | |

### Global entities (not per-campaign)

**LocationType**: id, name, icon, category, biomeOptions[], isSettlement, builtin
**GroupType**: id, name, icon
**Species**: id, name, pluralName, type, size, description, traits[], image
