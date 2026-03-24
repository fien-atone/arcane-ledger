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
A place in the game world. Locations are **hierarchical** — any location can have a parent.

```
Region
  └── Settlement  (has size: village / town / city / metropolis; population; climate)
        └── District
              └── Building
                    └── Dungeon
```

- A location can have a **map** (uploaded image + numbered markers)
- Markers can link to child Locations or NPCs
- Locations can be connected via `LocationConnection` (adjacent / route / portal)

#### Species
A global catalogue (not campaign-scoped). Humanoids, beasts, undead, constructs, fey, etc.

- Has **type** (14 options) and **size** (tiny → gargantuan)
- Linked to Characters and NPCs via `speciesId` (FK) + `species` (denormalised name for display)

---

### People

#### NPC (Non-Player Character)
A character controlled by the GM. Rich entity with:
- **Status**: alive / dead / missing / unknown / hostile
- **Location presence**: can be present at multiple locations with a contextual note ("evenings only", "hiding in cellar")
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
A **directional** social relation between any two entities.

```
EntityA  →(friendliness score)→  EntityB
```

- **Source types**: NPC, Character, Group
- **Target types**: NPC, Character, Group (any combination)
- **Friendliness**: integer −100 (hostile) to +100 (devoted ally)
  - ≥ 61 → Allied
  - 21–60 → Friendly
  - −20–20 → Neutral
  - −60– −21 → Unfriendly
  - ≤ −61 → Hostile
- A→B and B→A are **independent records** (asymmetric by design)

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
- Campaign-global (not per-campaign scoped)

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

---

## Planned Extensions

| Concept | Status | Notes |
|---|---|---|
| Items & Artifacts | Planned | Magical items, equipment, relics |
| Campaign Timeline | Planned | Visual chronological map of sessions and events |
| Player View | Planned | Separate access level for players |
| Real user accounts | Planned | Currently mock — `userId` field exists on PlayerCharacter |
| CampaignMember | Stub | Type defined, not yet surfaced in UI |
