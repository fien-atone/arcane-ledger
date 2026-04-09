# ADR-007: Section widgets — thin pages composing domain sections

**Status:** Accepted
**Date:** 2026-04-01 (retrospective, when Tier 1–3 refactor started)
**Decided by:** user + team-lead
**Related:** ADR-003 (FSD), ADR-008 (shared primitives), `docs/REFACTOR_PLAN.md`

## Context

By early 2026-04, several page files had grown beyond any reasonable size:
`LocationDetailPage` was 1623 lines, `NpcDetailPage` was 895. Each page
was a god-component that held 30+ pieces of local state, fetched data,
ran business logic, and rendered everything.

The growth pattern was pathological: each new feature added code to the
same page file. There was no pressure, structural or social, to break
them up. Any refactor would have to touch hundreds of lines at once.

## Decision

Every page is a **thin orchestrator** that does exactly three things:

1. Read route params
2. Load the root entity via a custom hook (`useNpcDetail`, etc.)
3. Compose **section widgets** — self-contained components that each own
   their own data fetching, state, and JSX

Section widgets live under `features/<domain>/sections/`. They never
receive bulk data through props; they fetch their own via specialized
Apollo hooks. State is either local to the section or lifted into a
domain hook (`useNpcDetail`) for genuinely cross-section concerns (like
the root entity + role + section flags).

Pages cap at ~200 lines. Sections cap at ~200 lines. If a section grows
past that, it gets split into sub-sections.

This was rolled out as a multi-tier refactor spanning 22 pages (Tier 1:
6 detail pages, Tier 2: 10 list pages, Tier 3: 6 top-level pages). The
full plan is in `docs/REFACTOR_PLAN.md`.

## Alternatives considered

- **Leave pages as-is** — not viable. Every new feature was making the
  problem worse. A specific proposal to split LocationDetailPage into
  "just extract a few components" would have produced dumb components
  that still needed all their data threaded through props — moving the
  god-component one level up.
- **Co-location under pages/** instead of features/ — would break the FSD
  layering and put domain code outside its feature boundary.
- **Split by UI structure rather than data fetching** — "one component
  per card on the page". Rejected because UI structure changes more
  often than data boundaries; data-fetch boundaries are more stable.
- **Full rewrite** — would have been faster to code initially but would
  have risked regressions across the whole app.

## Consequences

**Positive:**
- 9898 → 2314 lines total across 22 pages (77% reduction)
- Each section can be tested in isolation with MockedProvider
- Adding a new card to a page means adding a new section, not editing an
  existing 1000-line file
- When LocationDetailPage broke its map viewer, the fix was surgical
- Testing infrastructure (Vitest + Testing Library + Apollo MockedProvider)
  was set up during Tier 1 and grew from 131 → 307 frontend tests during
  the refactor, adding meaningful coverage for every migrated page

**Negative:**
- Each section making its own Apollo call means more HTTP requests per
  page load. Mitigated by Apollo's normalized cache (identical queries
  are deduped) and by the fact that each query returns only what that
  section needs.
- Section widgets can drift in style across features. Phase 2 (ADR-008)
  extracted shared primitives to combat this.
- The cost of setting up a new section (file, hook wiring, test) is
  higher than just inlining logic into a page. For very small features
  this overhead isn't worth it — use judgment.

## Notes

The refactor was executed as 22 separate branches, each merged individually
after the user verified the page worked in the browser. No single branch
was larger than ~500 LoC of net change. This made the refactor low-risk:
any individual step could be reverted without affecting others.

After Tier 1–3, Phase 2 (ADR-008) extracted cross-section redundancies
into shared primitives. F-11 (server-side search) then benefited from
the uniform `useXxxListPage` hook shape that the refactor produced.
