# ADR-005: Reference tables are per-campaign, not global

**Status:** Accepted
**Date:** 2026-03-30 (retrospective)
**Decided by:** user
**Related:** ADR-002 (Prisma schema), F-24 (type presets), F-25 (preset JSONs), F-26 (system selector)

## Context

Early in the backend design, reference tables like `LocationType`,
`GroupType`, `Species`, `SpeciesType` were modeled as **global** —
one set for the whole database, shared across all campaigns.

This seemed efficient: one "City" location type, used by every GM.

But TTRPG campaigns have different worlds, different genres, different
systems. One campaign might be D&D high fantasy with "Kingdom / City /
Dungeon". Another might be Call of Cthulhu with "City / Library / Asylum".
Sharing reference tables across campaigns forces either:
1. A giant "every possible type" catalog (bloated, confusing per-campaign)
2. Everyone agreeing on one taxonomy (impossible)
3. Some custom "enabled types per campaign" flag (complex, hacky)

## Decision

All reference tables are **per-campaign**, scoped with a `campaignId` FK.
`LocationType`, `GroupType`, `Species`, and `SpeciesType` all carry
`campaignId` and are isolated per campaign.

When a new campaign is created, it starts with **empty** reference tables.
The GM either fills them manually or (planned in F-24 / F-25) from a
preset template.

## Alternatives considered

- **Global reference tables with per-campaign enabled flags** — keeps one
  source of truth, allows per-campaign filtering. Rejected because it still
  forces all campaigns to live in one naming space, and fork/edit is
  messy.
- **Global with per-campaign overrides** — allow a campaign to override
  the name or icon of a global type. Complex, and still leaks global
  naming into every campaign.
- **Per-campaign from day one (this ADR)** — full isolation, each
  campaign owns its taxonomy.

## Consequences

**Positive:**
- Every campaign can have its own worldbuilding vocabulary
- Deleting a campaign cleanly cascades to its reference tables (via
  `onDelete: Cascade` on `campaignId`)
- Enables the "system preset" concept (F-25 / F-26): different campaigns
  can be based on different RPG systems with different preset taxonomies
- GMs can iterate on their taxonomy without affecting other campaigns

**Negative:**
- Empty state on a new campaign — the GM sees no types and has to create
  them. This is a UX problem addressed by F-24 (fill from template)
- More rows in the DB overall (one "City" per campaign instead of one
  globally)
- If we ever want cross-campaign reporting, we need to join by name or
  by some shared canonical ID (not currently needed)

## Notes

This decision is why legacy documentation (`architecture/data-model.md`,
which has now been deleted) was wrong. The old doc said "Species and
GroupType are global" — which was the pre-2026-03-30 design. When T-11
documentation consolidation ran in 2026-04-10, `docs/ERD.md` and
`docs/METAMODEL.md` were corrected to reflect the per-campaign reality.

F-25 plans to add JSON preset templates in `backend/src/presets/` (e.g.
`fantasy_en.json`, `fantasy_ru.json`) to make the empty state usable
without every GM having to type in their entire taxonomy from scratch.
