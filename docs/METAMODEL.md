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
A place in the game world. Locations are **hierarchical** — any location can have a parent — but the hierarchy is flexible by design: not all types must nest the same way.

**Location geometry** — three fundamentally different kinds:

| Geometry | Description | Types |
|---|---|---|
| **Containment** | A place with "inside" — can hold other locations and NPCs | `region`, `settlement`, `district`, `building`, `dungeon`, `landmark`, `wilderness`, `water`, `highland` |
| **Linear** | Connects two points; has start and end | `route` |

All types participate in the parent-child hierarchy. A `route` is a child of the region it passes through; its connection endpoints are expressed via `LocationConnection`.

**Type taxonomy:**

```
region          — large political/geographic area (continent, country, province, island)
│
├── wilderness  — uninhabited zone (forest, swamp, desert, plains, tundra, jungle…)
│   └── landmark — singular point of interest within a wilderness (shrine, ruin, cave entrance)
│
├── water       — body of water (lake, river, sea, bay, ocean, delta)
│
├── highland    — elevated terrain (mountain range, peak, plateau, valley, pass)
│   └── landmark
│
├── settlement  — populated place (village / town / city / metropolis)
│   ├── district  — sub-area of settlement (the Docks, the Market Quarter)
│   │   └── building — interior space (tavern, temple, keep)
│   └── dungeon   — explorable interior below/within (sewers, catacombs, vaults)
│
├── dungeon     — standalone explorable (cave system, ancient tomb, bandit keep)
├── landmark    — notable singular feature not inside a settlement (monument, ruined tower)
└── route       — named linear feature (road, river as route, trade route, mountain pass)
```

**Biome** — sub-classification for area and linear types (ignored for containment types):

| Type | Biome options |
|---|---|
| `wilderness` | forest, swamp, desert, plains, tundra, jungle, badlands, savanna |
| `water` | lake, river, sea, bay, ocean, delta, marsh |
| `highland` | mountain_range, peak, plateau, valley, pass |
| `route` | road, trade_route, river_route, sea_lane, mountain_pass, tunnel |

**Settlement** retains its own sub-fields: `settlementType` (village/town/city/metropolis) and `settlementPopulation`.

**Map support** — any Location can have an uploaded image with numbered `MapMarker`s. Markers link to child Locations or NPCs.

#### LocationConnection
Expresses that two locations are **reachable from each other**, independently of the parent-child hierarchy.

- `type`: road, river, path, sea_route, portal, tunnel
- `travelTime`: human-readable ("3 days on foot", "half a day by horse")
- `routeLocationId`: optional FK to a `route`-type Location when the connection is a named road/river

> **Dual representation for named routes:** a road like "The King's Road" is both a `Location` of type `route` (it has a name, lore, danger level, GM notes) **and** a `LocationConnection` between the two settlements it links. `routeLocationId` ties these together.

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
10. **Location type determines valid sub-fields** — `biome` applies only to `wilderness`, `water`, `highland`, `route`; `settlementType` / `settlementPopulation` apply only to `settlement`; `climate` is superseded by `biome` on `region`/`wilderness`.
11. **Named routes are dual-represented** — a named road/river is both a `Location` (type `route`) for lore/GM notes and a `LocationConnection` for travel links; `routeLocationId` on the connection ties them together.

---

## Planned Extensions

| Concept | Status | Notes |
|---|---|---|
| **Relation Graph view** | Planned | Visual node-edge graph of all Relation records. Nodes = NPCs, Characters, Groups. Edges = Relations, coloured and weighted by friendliness score. Filterable by entity type and friendliness range. |
| **Location Graph view** | Planned | Visual map of Locations as nodes and LocationConnections as edges. Useful for overland travel planning. |
| Items & Artifacts | Planned | Magical items, equipment, relics |
| Campaign Timeline | Planned | Visual chronological map of sessions and events |
| Player View | Planned | Separate access level for players |
| Real user accounts | Planned | Currently mock — `userId` field exists on PlayerCharacter |
| CampaignMember | Stub | Type defined, not yet surfaced in UI |
