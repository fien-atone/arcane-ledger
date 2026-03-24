# Arcane Ledger — Entity Relationship Diagram

Mermaid ERD. Render in any Markdown viewer that supports Mermaid (GitHub, Notion, VS Code with extension).

---

```mermaid
erDiagram

  %% ── Core container ───────────────────────────────────────────────────────

  Campaign {
    string id PK
    string title
    string description
    string coverImage
    string coverGradient
    string createdAt
    string archivedAt
  }

  CampaignMember {
    string id PK
    string campaignId FK
    string userId FK
    string role
    string joinedAt
  }

  %% ── World ────────────────────────────────────────────────────────────────

  Location {
    string id PK
    string campaignId FK
    string parentLocationId FK
    string name
    string[] aliases
    string type
    string settlementType
    number settlementPopulation
    string climate
    string description
    string gmNotes
    string image
    string createdAt
  }

  MapMarker {
    string id PK
    string locationId FK
    number x
    number y
    string label
    string linkedLocationId FK
    string linkedNpcId FK
  }

  LocationConnection {
    string locationAId FK
    string locationBId FK
    string type
    string note
  }

  Species {
    string id PK
    string name
    string pluralName
    string type
    string size
    string description
    string[] traits
    string image
    string createdAt
  }

  %% ── People ───────────────────────────────────────────────────────────────

  NPC {
    string id PK
    string campaignId FK
    string name
    string[] aliases
    string status
    string gender
    number age
    string speciesId FK
    string species
    string appearance
    string personality
    string motivation
    string flaws
    string description
    string gmNotes
    string image
    string lastSeenLocationId FK
    string createdAt
    string updatedAt
  }

  NPCLocationPresence {
    string npcId FK
    string locationId FK
    string note
  }

  NPCGroupMembership {
    string npcId FK
    string groupId FK
    string relation
    string subfaction
  }

  NPCRelation {
    string npcId FK
    string relatedNpcId FK
    string type
    string note
  }

  PlayerCharacter {
    string id PK
    string campaignId FK
    string userId FK
    string name
    string gender
    number age
    string speciesId FK
    string species
    string class
    string appearance
    string background
    string personality
    string motivation
    string bonds
    string flaws
    string gmNotes
    string image
    string createdAt
    string updatedAt
  }

  %% ── Social graph ─────────────────────────────────────────────────────────

  Relation {
    string id PK
    string campaignId FK
    string fromEntityType
    string fromEntityId FK
    string toEntityType
    string toEntityId FK
    number friendliness
    string note
    string createdAt
    string updatedAt
  }

  %% ── Story ────────────────────────────────────────────────────────────────

  Session {
    string id PK
    string campaignId FK
    number number
    string title
    string datetime
    string brief
    string summary
    string nextSessionNotes
    string createdAt
  }

  SessionLocation {
    string sessionId FK
    string locationId FK
  }

  Quest {
    string id PK
    string campaignId FK
    string title
    string description
    string giverId FK
    string reward
    string status
    string notes
    string createdAt
    string completedAt
  }

  %% ── Organisation ─────────────────────────────────────────────────────────

  Group {
    string id PK
    string campaignId FK
    string name
    string type FK
    string[] aliases
    string description
    string goals
    string symbols
    string gmNotes
    string partyRelation
    string image
    string createdAt
    string updatedAt
  }

  GroupTypeEntry {
    string id PK
    string name
    string icon
    string description
    string createdAt
  }

  %% ── Relationships ────────────────────────────────────────────────────────

  Campaign        ||--o{ CampaignMember      : "has members"
  Campaign        ||--o{ Location            : "contains"
  Campaign        ||--o{ NPC                 : "contains"
  Campaign        ||--o{ PlayerCharacter     : "contains"
  Campaign        ||--o{ Session             : "contains"
  Campaign        ||--o{ Quest               : "contains"
  Campaign        ||--o{ Group               : "contains"
  Campaign        ||--o{ Relation            : "contains"

  Location        ||--o{ Location            : "parent of"
  Location        ||--o{ MapMarker           : "has markers"
  Location        }o--o{ Location            : "connected to (LocationConnection)"

  Species         ||--o{ NPC                 : "species of"
  Species         ||--o{ PlayerCharacter     : "species of"

  NPC             ||--o{ NPCLocationPresence : "present at"
  NPC             ||--o{ NPCGroupMembership  : "member of"
  NPC             ||--o{ NPCRelation         : "related to (NPC)"
  NPCLocationPresence }o--|| Location        : "at location"
  NPCGroupMembership  }o--|| Group           : "in group"
  MapMarker       }o--o| Location            : "links to location"
  MapMarker       }o--o| NPC                 : "links to NPC"

  Quest           }o--o| NPC                 : "given by"

  Session         ||--o{ SessionLocation     : "took place at"
  SessionLocation }o--|| Location            : "location"

  Group           }o--|| GroupTypeEntry      : "typed by"
  Group           ||--o{ NPCGroupMembership  : "has members"

  Relation        }o--o| NPC                 : "from/to NPC"
  Relation        }o--o| PlayerCharacter     : "from/to Character"
  Relation        }o--o| Group               : "from/to Group"
```

---

## Notes

- **Relation** is polymorphic — `fromEntityType` / `toEntityType` can be `npc`, `character`, or `group`. In a relational DB this would be implemented as a polymorphic FK or a union of nullable FKs.
- **NPCGroupMembership** and **NPCLocationPresence** are currently embedded arrays on the NPC document (not separate tables in the localStorage mock). The ERD shows them as logical join tables for clarity.
- **SessionLocation** is `Session.locationIds: string[]` embedded on the Session — shown as a join table for ERD readability.
- **Species** is **not** campaign-scoped — it's a global catalogue shared across all campaigns.
- **GroupTypeEntry** is also global (not per-campaign).
- **MapMarker** is embedded in `Location.mapMarkers[]` in the current implementation.
