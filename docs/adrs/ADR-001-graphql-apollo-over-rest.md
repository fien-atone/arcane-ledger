# ADR-001: GraphQL with Apollo Client and Apollo Server over REST

**Status:** Accepted
**Date:** 2026-03-27 (retrospective)
**Decided by:** team-lead + user
**Related:** ADR-002 (persistence), ADR-003 (frontend architecture)

## Context

The project started as a frontend-only prototype using TanStack Query against
a localStorage mock. When we added a real backend, we needed to pick an API
style. The data model has deeply interrelated entities (NPCs → groups →
locations → sessions → quests, plus polymorphic relations) and the frontend
needs to fetch partial slices of this graph depending on the page. Classic
REST with resource-per-endpoint fits poorly.

## Decision

We will use **GraphQL as the sole client-server API**, with Apollo Client on
the frontend and Apollo Server 4 on the backend. A single endpoint
(`/graphql`) for HTTP; WebSockets for subscriptions via `graphql-ws`.

## Alternatives considered

- **REST with resource-per-endpoint** — poor fit for the graph-like domain
  model; would require many chained requests or ad-hoc `?include=` query
  params, both bad.
- **tRPC** — type-safe and simpler, but we wanted first-class subscriptions
  for real-time updates and tRPC's sub support was less mature at the time.
  Also locks both ends to TypeScript, which GraphQL doesn't.
- **Hybrid REST + GraphQL** — keep REST for simple CRUD, GraphQL for
  complex reads. Rejected because two API styles double the conventions,
  double the auth wiring, double the testing.

## Consequences

**Positive:**
- Single endpoint, single auth flow, single cache (Apollo normalizes)
- Subscriptions for free via `graphql-ws`
- Frontend can request exactly the fields it needs per page, reducing
  over-fetching
- Schema is a contract that both sides can validate against

**Negative:**
- Resolvers must manually handle N+1 problems (partially addressed with
  DataLoader in 0.3.1)
- GraphQL introspection must be disabled in production (tracked in
  SECURITY.md as a deploy-prep gap)
- Apollo Client v4 brings breaking changes from v3 — `ErrorLink` class,
  `CombinedGraphQLErrors.is()`, etc. Documented in `docs/STACK.md` as
  version gotchas.
- File upload doesn't fit cleanly in GraphQL; we use a separate REST
  endpoint `POST /api/upload` for that one case.

## Notes

The migration from TanStack Query + localStorage mock to Apollo Client was
one of the larger refactors early in the project. The mock repositories
survived in `frontend/src/shared/api/repositories/` to keep an offline demo
mode working (see ADR-010).
