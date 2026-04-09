# ADR-010: Retain legacy mock mode alongside real backend

**Status:** Accepted
**Date:** 2026-04-10 (retrospective)
**Decided by:** user
**Related:** ADR-001 (GraphQL migration)

## Context

The project started as frontend-only. All data lived in `localStorage`,
fetched via repository-pattern classes in
`frontend/src/shared/api/repositories/`. When the real backend was added
(ADR-001), the repositories stopped being the primary data path — Apollo
Client + GraphQL took over — but the repositories and their
`mockData/` seed files were not deleted.

Today they survive as a **mock mode**: with `VITE_USE_MOCK=true`, three
detail hooks (`useNpcDetail`, `useLocationDetail`, `useCharacterDetail`)
fall back to the repositories instead of calling the backend. The rest
of the app has been fully migrated to Apollo.

T-1 in the backlog is "Remove mock repositories and mockData after full
backend migration". It's been sitting at 🟡 priority for months.

## Decision

**Keep mock mode.** It's useful for:
- Offline demo of the frontend without spinning up backend + Postgres
- Showing the app to non-technical people who don't want to install Docker
- Frontend-only development sessions where the backend isn't relevant
- Historical continuity — the code has no active bugs, it's just legacy

T-1 remains **deferred**, not rejected. If mock mode ever actively breaks
a build or confuses a feature, it gets removed at that point. Until
then, the small ongoing cost (3 hooks have a dual code path, `mockData/`
takes up disk) is lower than the cost of maintaining a production-only
build with no demo path.

## Alternatives considered

- **Remove immediately** — clean house. Rejected because there's no
  active pain, and the offline demo capability is non-trivial to recreate.
- **Remove the repositories but keep mockData for tests** — test fixtures
  and mock-mode data are the same files; splitting them would be
  busywork.
- **Migrate the 3 remaining hooks to Apollo-only** — the issue isn't the
  hooks, it's whether mock mode is worth keeping at all. If the decision
  is "keep it", we keep all three.

## Consequences

**Positive:**
- Zero migration work right now
- Offline demo still works
- `VITE_USE_MOCK` remains a documented env var (see frontend README)

**Negative:**
- Three detail hooks have a dual code path (adds ~15 lines to each)
- New contributors see `mockData/` and wonder what it is — docs now
  address this explicitly (see `docs/ARCHITECTURE.md`)
- If mock mode ever silently diverges from real mode, bugs could hide
  there for a long time — not currently being tested

## Notes

This ADR is written to **formalize the "keep it" decision** so it doesn't
keep getting re-litigated every few sessions. If mock mode ever causes
real pain, revisit this ADR and flip to "Superseded by ADR-NNN: remove
mock mode".
