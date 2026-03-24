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
    string biome
    string settlementType
    number settlementPopulation
    string description
    string gmNotes
    string image
    string createdAt
  }

  %% type values:
  %%   plane, continent, ocean, region,
  %%   wilderness, water, highland,
  %%   settlement, district, building,
  %%   dungeon, landmark, route
  %%
  %% biome values (by type):
  %%   ocean  → ocean | sea | strait | gulf
  %%   wilderness → forest | swamp | desert | plains | tundra | jungle | badlands | savanna
  %%   highland   → mountain_range | peak | plateau | valley | pass
  %%   region     → island | peninsula  (when in water context)
  %%   route      → road | trade_route | river_route | sea_lane | mountain_pass | tunnel
  %%   water      → lake | river | bay | delta | marsh

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
    string routeLocationId FK
    string type
    string travelTime
    string note
  }

  %% LocationConnection.type values:
  %%   road | path | river | sea_route | border | portal | tunnel | mountain_pass
  %%
  %% LocationConnection is unrestricted — any location type can connect to any other.
  %% A continent connects to an ocean. A town connects to a road (route).
  %% The type field describes the nature of the link, not the endpoint types.

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
  %% Nodes: NPC, PlayerCharacter, Group
  %% Edges: Relation (directional, asymmetric, -100 to +100 friendliness)

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
  Location        }o--o{ LocationConnection  : "endpoint A"
  Location        }o--o{ LocationConnection  : "endpoint B"
  Location        |o--o{ LocationConnection  : "named route (routeLocationId)"

  Species         ||--o{ NPC                 : "species of"
  Species         ||--o{ PlayerCharacter     : "species of"

  NPC             ||--o{ NPCLocationPresence : "present at"
  NPC             ||--o{ NPCGroupMembership  : "member of"
  NPC             ||--o{ NPCRelation         : "related to NPC"
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

## Location Type Taxonomy

```
plane               (Material Plane, Feywild, Shadowfell — optional top level)
├── continent       large landmass
│   ├── region      kingdom, province, territory
│   │   ├── wilderness   biome: forest|swamp|desert|plains|tundra|jungle|badlands|savanna
│   │   │   └── landmark
│   │   ├── highland     biome: mountain_range|peak|plateau|valley|pass
│   │   │   └── landmark
│   │   ├── water        biome: lake|river|bay|delta|marsh  (sub-regional)
│   │   ├── settlement   size: village|town|city|metropolis
│   │   │   ├── district
│   │   │   │   └── building
│   │   │   └── dungeon
│   │   ├── dungeon      standalone (cave, tomb, ruin interior)
│   │   ├── landmark     monument, ruined tower, shrine
│   │   └── route        biome: road|trade_route|river_route|sea_lane|mountain_pass|tunnel
│   │       └── landmark  wayshrine, toll gate, bridge
│   └── ocean       biome: ocean|sea|strait|gulf
│       └── region  biome: island  ← island = region in water context
│           └── [full land hierarchy]
└── ocean           top-level if no continent parent
```

### Containment Matrix

`✓` = valid parent-child, `—` = invalid.

| Parent ↓ · Child → | plane | continent | ocean | region | wilderness | water | highland | settlement | district | building | dungeon | landmark | route |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **plane** | — | ✓ | ✓ | ✓ | — | — | — | — | — | — | — | — | — |
| **continent** | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| **ocean** | — | — | ✓ | ✓ | — | — | — | — | — | — | — | ✓ | — |
| **region** | — | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| **wilderness** | — | — | — | — | ✓ | ✓ | — | ✓ | — | — | ✓ | ✓ | ✓ |
| **water** | — | — | — | — | — | ✓ | — | — | — | — | — | ✓ | — |
| **highland** | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ |
| **settlement** | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | ✓ | — |
| **district** | — | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ | — |
| **building** | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| **dungeon** | — | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — |
| **landmark** | — | — | — | — | — | — | — | — | — | ✓ | ✓ | — | — |
| **route** | — | — | — | — | — | — | — | — | — | — | — | ✓ | — |

Top-level locations (no parent): `plane`, `continent`, `ocean`, or standalone `region`/`dungeon`.

---

## LocationConnection: unrestricted graph edges

`LocationConnection` places no restrictions on which location types can be connected. Any location can connect to any other — the `type` field describes the nature of the link:

| type | Example |
|---|---|
| `road` | Town ↔ Town via a named road |
| `path` | Village ↔ Wilderness landmark |
| `river` | Region ↔ Region along a river |
| `sea_route` | Continent ↔ Ocean, Island ↔ Mainland |
| `border` | Continent borders an ocean; two regions share a frontier |
| `portal` | Dungeon ↔ Plane (magical gate) |
| `tunnel` | Settlement ↔ Dungeon (underground passage) |
| `mountain_pass` | Region ↔ Region through a highland |

## LocationConnection: dual-representation of named routes

A named road or river can appear in two ways simultaneously:

| As... | Purpose |
|---|---|
| `Location` (type `route`) | Has a name, lore, GM notes, danger level — it's a thing in the world |
| `LocationConnection` | Expresses that Town A and Town B are reachable from each other via this route |

`LocationConnection.routeLocationId` links the connection back to the named Location, keeping both in sync.

---

## Social Graph (Relation)

`Relation` is the edge set of the **Relation Graph**:

```
Nodes  — NPC, PlayerCharacter, Group
Edges  — Relation (directed, weighted by friendliness -100..+100)
```

- Directed: A→B and B→A are independent records (asymmetric feelings)
- Weight bands: Allied ≥61, Friendly 21–60, Neutral −20–20, Unfriendly −60– −21, Hostile ≤−61
- Planned graph view: force-directed canvas, edge colour by friendliness, filterable by entity type and relationship band

---

## Implementation Notes

- **Relation** is polymorphic — `fromEntityType` / `toEntityType` discriminate between `npc`, `character`, `group`. In a relational DB: polymorphic FK or a union of nullable FKs.
- **NPCGroupMembership** and **NPCLocationPresence** are embedded arrays on the NPC document in the current localStorage mock. The ERD shows them as logical join entities for clarity.
- **SessionLocation** is `Session.locationIds: string[]` embedded on Session — shown as a join entity for ERD readability.
- **Species** and **GroupTypeEntry** are global (not campaign-scoped).
- **MapMarker** is embedded in `Location.mapMarkers[]` in the current implementation.
- **LocationConnection** has no surrogate PK in the current implementation — it is embedded or keyed by `(locationAId, locationBId)`.
