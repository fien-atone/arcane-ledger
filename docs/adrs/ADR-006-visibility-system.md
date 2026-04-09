# ADR-006: Two-layer visibility — entity-level and field-level

**Status:** Accepted
**Date:** 2026-04-01 (retrospective, part of 0.3.0 release)
**Decided by:** user + team-lead
**Related:** ADR-001 (GraphQL), `docs/PRODUCT.md`, SECURITY.md T-3

## Context

The core product mechanic is information asymmetry between GM and players.
The GM knows everything about the campaign; players only know what the GM
has chosen to reveal. This is not just a feature — it's the reason the app
exists (see `docs/PRODUCT.md`).

The question: at what granularity does the GM control visibility?

Option 1: per-entity. "Player can see this NPC or not."
Option 2: per-field-per-entity. "Player knows this NPC exists but not
their `motivation` field."
Option 3: per-field-per-user. "Player Alice knows this NPC's motivation,
player Bob doesn't."

## Decision

Visibility is controlled at **two levels**:

1. **Entity-level** — `playerVisible: boolean` on NPCs, Locations,
   Quests, Groups, Sessions. If false, the entity is hidden from all
   players entirely.
2. **Field-level** — `playerVisibleFields: string[]` on each entity.
   When `playerVisible: true`, this list restricts which specific fields
   players see. Fields not in the list are stripped server-side before
   the response leaves the backend.

Per-user visibility (option 3) is **out of scope** for now.

## Alternatives considered

- **Entity-level only** — simpler but insufficient. A GM often wants
  players to know an NPC exists without revealing the NPC's GM-only notes
  or secret motivation. Entity-level makes this impossible.
- **Per-user visibility** — most powerful. Supports "Alice knows a secret
  that Bob doesn't." But it requires per-user state on every visibility
  field, which is a lot of state and a lot of UI. Deferred as a potential
  future feature (was VIS-02 in the old requirements doc).
- **Client-side filtering** — send everything to the client, hide in the
  UI. Rejected as a security anti-pattern — sensitive data would be in
  the response and in the Apollo cache, trivially exposed by anyone with
  devtools.

## Consequences

**Positive:**
- Resolvers filter `playerVisibleFields` server-side — sensitive data
  never reaches the player client at all (SECURITY.md T-3 mitigation)
- Two clearly distinct levers: "hide this entity entirely" or "reveal some
  parts of it"
- Field-level visibility is stored as an array of strings, simple enough
  to wire through the UI
- Gated behind the Party module — campaigns without Party don't see the
  visibility controls, keeping simpler campaigns simple

**Negative:**
- Requires resolvers to know which fields belong to which entities (the
  filter list isn't validated by the schema — a typo in a field name is
  silently ignored)
- Player-side caching is tricky: if the GM reveals a new field, the
  client's cached entity is stale. Handled via GraphQL subscriptions
  (`campaignUpdated` channel re-invalidates)
- Doesn't support the "Alice knows, Bob doesn't" case. If we ever need
  it, this ADR gets superseded.

## Notes

The visibility system was implemented in 0.3.0 as part of a larger
"player-facing" effort that also added role-based field visibility on the
GM notes and a visibility panel for the GM to toggle per entity.

Before 0.3.1, visibility controls were ungated, which was confusing for
campaigns that didn't use the Party module at all. In 0.3.1, visibility
controls were gated behind `sectionEnabled('party')` so they only appear
when relevant.
