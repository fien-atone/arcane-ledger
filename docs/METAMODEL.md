# Arcane Ledger — Domain Metamodel

The metamodel describes **what concepts exist**, how they relate to each other, and what rules govern them — independent of implementation details.

---

## Core Concepts

### Campaign
The top-level container. Every entity belongs to exactly one campaign.

- Has a **title**, optional description, and cover image
- Tracked as a `CampaignSummary` in lists (includes computed stats: session count, member count, last session)
- Members have a role: **GM** or **Player**

---

### World Entities (the setting)

#### Location
A place in the game world. The location model has two orthogonal structures:

- **Hierarchy** (`parentLocationId`) — containment tree, with rules on which types can contain which
- **Graph** (`LocationConnection`) — unrestricted edges between any two locations

Both coexist. A continent is a child of a plane (hierarchy) and also connects to an ocean (graph).

---

**Type taxonomy:**

```
plane               — multiverse container (Material Plane, Feywild, Shadowfell, Nine Hells)
│                     optional — campaigns that stay in one world may omit this level
│
├── continent       — large landmass (Faerûn, Khorvaire, a major island group)
│   │
│   ├── region      — political/geographic subdivision (kingdom, province, territory)
│   │   │
│   │   ├── wilderness   — uninhabited zone
│   │   │   biome: forest | swamp | desert | plains | tundra | jungle | badlands | savanna
│   │   │   └── landmark — singular point of interest (shrine, ruin, cave entrance)
│   │   │
│   │   ├── highland     — elevated terrain
│   │   │   biome: mountain_range | peak | plateau | valley | pass
│   │   │   └── landmark
│   │   │
│   │   ├── settlement   — populated place
│   │   │   size: village | town | city | metropolis
│   │   │   ├── district   — sub-area (the Docks, the Market Quarter)
│   │   │   │   └── building — interior space (tavern, temple, keep)
│   │   │   └── dungeon    — explorable interior (sewers, catacombs, vaults)
│   │   │
│   │   ├── dungeon      — standalone explorable (cave system, ancient tomb, bandit fort)
│   │   ├── landmark     — notable point not inside a settlement (monument, ruined tower)
│   │   └── route        — named linear feature
│   │       biome: road | trade_route | river_route | sea_lane | mountain_pass | tunnel
│   │       └── landmark — wayshrine, toll gate, bridge
│   │
│   └── [water, highland, wilderness can also be direct children of continent]
│
└── ocean           — intercontinental body of water
    biome: ocean | sea | strait | gulf
    │
    └── region      — island (a region whose context is water, not land)
        biome: island
        └── [full land hierarchy below: wilderness, settlement, dungeon, etc.]
```

> **Islands** are `region` with `biome: island`, placed as children of an `ocean` or `sea` (`water`). No separate type needed.

---

**Biome field** — sub-classification for types that need it:

| Type | Biome options |
|---|---|
| `ocean` (water) | ocean, sea, strait, gulf |
| `wilderness` | forest, swamp, desert, plains, tundra, jungle, badlands, savanna |
| `highland` | mountain_range, peak, plateau, valley, pass |
| `region` | *(optional)* island, peninsula — when geography matters |
| `route` | road, trade_route, river_route, sea_lane, mountain_pass, tunnel |

`water` (lake/river scale — sub-regional) keeps the existing biome: lake, river, bay, delta, marsh.

---

**Containment rules** — which types can be children of which. Enforced in the UI parent selector and backend validation.

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

Notable decisions:
- `ocean` can contain `region` (biome: island) — islands are regions in water context
- `plane` contains `continent`, `ocean`, and optionally top-level `region` (for campaigns that skip the continent level)
- `water` (sub-regional — lake, river) cannot contain land — a port city is a child of its *region*, not the bay
- `district`, `building`, `dungeon` are interior types — cannot appear at geographic scope
- A location with no parent is top-level (`plane`, `continent`, `ocean`, or standalone `region`/`dungeon`)

---

#### LocationConnection
A **graph edge** between any two locations, regardless of type or position in the hierarchy.

There are no type restrictions on which locations can be connected — the connection `type` describes the nature of the link:

| Connection type | Example |
|---|---|
| `road` | Town ↔ Town via the King's Road |
| `path` | Village ↔ Wilderness shrine |
| `river` | Region ↔ Region along a river course |
| `sea_route` | Continent ↔ Ocean ↔ Island |
| `border` | Continent borders an ocean; two regions share a frontier |
| `portal` | Dungeon ↔ Plane (magical gate) |
| `tunnel` | Settlement ↔ Dungeon via underground passage |
| `mountain_pass` | Region ↔ Region through a highland |

Additional fields:
- `travelTime` — human-readable ("3 days on foot", "half a day by horse")
- `routeLocationId` — optional FK to a `route`-type Location when the connection corresponds to a named road/river

> **Dual representation for named routes:** "The King's Road" is both a `Location` of type `route` (it has a name, lore, danger level, GM notes) **and** a `LocationConnection` between the two settlements it links. `routeLocationId` ties them together.

> **The location model is a graph, not just a tree.** The hierarchy (parentLocationId) defines containment. LocationConnection defines traversal and adjacency — independently of containment.

---

#### Species
A global catalogue (not campaign-scoped). Humanoids, beasts, undead, constructs, fey, etc.

- Has **type** (14 options) and **size** (tiny → gargantuan)
- Linked to Characters and NPCs via `speciesId` (FK) + `species` (denormalised name for display)

---

### People

#### NPC (Non-Player Character)
A character controlled by the GM. Rich entity with:
- **Status**: alive / dead / missing / unknown / hostile
- **Location presence**: can be present at multiple locations simultaneously with a contextual note ("evenings only", "hiding in cellar")
- **Group membership**: belongs to zero or more Groups with a role/subfaction note
- **NPC-to-NPC relations**: typed links (sibling, mentor, rival, ally, etc.) with a note
- **Social relations** (general): covered by the `Relation` entity below

#### PlayerCharacter
A character controlled by a player. Belongs to a campaign and a user.
- Fields for class, background, personality, motivation, bonds, flaws
- GM Notes (private, not shown to players)
- Linked to a Species via `speciesId`

---

### Social Graph

#### Relation
A **directional** social relation between any two entities. Forms the data backbone of the **Relation Graph** view (see Planned Extensions).

```
EntityA  →(friendliness score)→  EntityB
```

- **Participant types**: NPC, Character, Group (any combination, both sides)
- **Friendliness**: integer −100 (hostile) to +100 (devoted ally)
  - ≥ 61 → Allied
  - 21–60 → Friendly
  - −20–20 → Neutral
  - −60– −21 → Unfriendly
  - ≤ −61 → Hostile
- A→B and B→A are **independent records** (asymmetric by design)
- Each Relation has an optional free-text `note`

---

### Story Entities

#### Session
A log of one game session.
- Numbered sequentially within a campaign
- Has a **brief** (short recap) and **summary** (full notes)
- Tagged with one or more Locations where it took place
- Optional **nextSessionNotes** for prep

#### Quest
A task or objective for the party.
- **Status**: active / completed / failed / unavailable / unknown
- Optional **giver** (links to an NPC)
- Optional reward text

---

### Organisation

#### Group
A faction, guild, cult, family, council, or other organisation.
- **Type** is a free-form string referencing a `GroupTypeEntry` by name
- **partyRelation**: how the group relates to the player party (allied, hostile, neutral, etc.)
- Members are NPCs (tracked via `NPCGroupMembership`)

#### GroupTypeEntry
A managed vocabulary of group types (e.g. "Guild", "Cult", "Noble House").
- Has a Material Symbol **icon** for display
- Global (not per-campaign scoped)

---

## Ownership & Scoping

| Entity | Scoped to campaign? | Global? |
|---|---|---|
| Campaign | — | ✓ |
| Location | ✓ | |
| NPC | ✓ | |
| PlayerCharacter | ✓ | |
| Session | ✓ | |
| Quest | ✓ | |
| Group | ✓ | |
| Relation | ✓ | |
| Species | | ✓ (shared across campaigns) |
| GroupTypeEntry | | ✓ (shared across campaigns) |

---

## Key Business Rules

1. **Every campaign-scoped entity carries `campaignId`** — no entity is shared between campaigns (except Species and GroupTypeEntry).
2. **Species is denormalised onto Characters/NPCs** — `speciesId` is the FK; `species` (name string) is kept for display without a join.
3. **NPC location presence is a list** — an NPC can be "present" at multiple locations simultaneously (with notes), not just one.
4. **Relations are directional and asymmetric** — Alvin's feelings toward Kronhave are a separate record from Kronhave's feelings toward Alvin.
5. **Group membership is on the NPC** — `NPCGroupMembership[]` is a field of NPC, not a join table (current mock model).
6. **Map markers are embedded in Location** — `MapMarker[]` is stored as part of the Location document, not a separate collection.
7. **Session ↔ Location is many-to-many** — `Session.locationIds: string[]` (list of FKs).
8. **Quest giver is optional** — `Quest.giverId` references an NPC but may be null (anonymous quest).
9. **GM Notes are private** — present on Location, NPC, Character, Group. Intended to be hidden from player view (player view is a planned feature).
10. **Location type determines valid sub-fields** — `biome` applies to `ocean`, `wilderness`, `highland`, `region` (when island), `route`; `settlementType`/`settlementPopulation` apply only to `settlement`.
11. **Named routes are dual-represented** — a named road/river is both a `Location` (type `route`) for lore/GM notes and a `LocationConnection` for traversal; `routeLocationId` on the connection ties them together.
12. **Islands are regions in water context** — an island is `type: region`, `biome: island`, `parentLocationId` pointing to an `ocean`/`sea` Location. No separate island type.
13. **LocationConnection is unrestricted** — any location can connect to any other regardless of type. A continent connects to an ocean. A town connects to a road. Connection `type` describes the nature of the link, not the types of the endpoints.

---

## Planned Extensions

| Concept | Status | Notes |
|---|---|---|
| **Relation Graph view** | Planned | Visual node-edge graph of all Relation records. Nodes = NPCs, Characters, Groups. Edges = Relations, coloured and weighted by friendliness score. Filterable by entity type and friendliness range. |
| **Location Graph view** | Planned | Visual map of Locations as nodes and LocationConnections as edges. Hierarchy edges (containment) + connection edges (traversal) rendered differently. Useful for overland travel planning. |
| Items & Artifacts | Planned | Magical items, equipment, relics |
| Campaign Timeline | Planned | Visual chronological map of sessions and events |
| Player View | Planned | Separate access level for players |
| Real user accounts | Planned | Currently mock — `userId` field exists on PlayerCharacter |
| CampaignMember | Stub | Type defined, not yet surfaced in UI |
