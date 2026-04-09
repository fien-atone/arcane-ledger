# ADR-003: Feature-Sliced Design for the frontend

**Status:** Accepted
**Date:** 2026-03-24 (retrospective)
**Decided by:** user
**Related:** ADR-007 (section widgets)

## Context

React projects over a certain size struggle with organization. "Group by
file type" (all components together, all hooks together) scales badly.
"Group by feature" gives clearer boundaries but invites inconsistency across
features.

Feature-Sliced Design (FSD) is a community-driven convention for organizing
React apps by domain and layer. It's opinionated but readable: every file
has one obvious home.

## Decision

The frontend follows **Feature-Sliced Design** with these layers:

```
frontend/src/
├── app/          — router, providers, layout shells
├── pages/        — one file per route (thin orchestrators)
├── widgets/      — cross-cutting UI (Sidebar, Topbar, DiceRoller)
├── features/     — domain slices
│   └── <domain>/
│       ├── api/
│       ├── hooks/
│       ├── sections/
│       ├── ui/
│       └── model/
├── shared/
│   ├── ui/
│   ├── hooks/
│   └── api/
└── entities/     — TypeScript types
```

Imports go downward only: `pages` → `widgets` / `features` → `shared` / `entities`.
`shared` never imports from `features`.

## Alternatives considered

- **Group by type** (`components/`, `hooks/`, `utils/`) — gets unwieldy past
  a few dozen files; components from unrelated domains sit next to each
  other.
- **Atomic Design** (atoms / molecules / organisms) — more visual, less
  domain-aware; doesn't help with data-fetching boundaries.
- **One folder per route** — would work but wouldn't give us the natural
  shared layer for cross-feature utilities.

## Consequences

**Positive:**
- Every file has an obvious home
- Cross-feature imports are explicit and directional
- New contributors (and agents) can navigate quickly once they know the
  layers
- `shared/ui/` and `shared/hooks/` became a natural home for extracted
  primitives during Phase 2

**Negative:**
- The FSD convention isn't universally known; requires one-paragraph intro
  in onboarding
- The `entities/` folder collided slightly with Prisma's "entity" concept;
  our `entities/` holds frontend TypeScript types that mirror GraphQL,
  not database entities

## Notes

See `frontend/CLAUDE.md` for the full frontend convention doc. The section
widgets pattern (ADR-007) is a natural extension of FSD: it extends the
`features/<domain>/` structure with a `sections/` subfolder.
