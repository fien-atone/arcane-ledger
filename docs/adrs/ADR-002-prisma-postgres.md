# ADR-002: Prisma + PostgreSQL as the persistence stack

**Status:** Accepted
**Date:** 2026-03-27 (retrospective)
**Decided by:** team-lead + user
**Related:** ADR-001 (GraphQL), ADR-005 (per-campaign reference tables)

## Context

When the backend was added, we needed a database and an ORM. The data model
is fundamentally relational: users belong to campaigns, campaigns own NPCs
and locations and sessions, sessions link to all of the above via junction
tables, NPCs have polymorphic social relations with other NPCs / characters /
groups. Queries constantly traverse multiple relations.

## Decision

**PostgreSQL 17** as the database, **Prisma 6** as the ORM. Schema lives in
`backend/prisma/schema.prisma` and is the source of truth for the data
model. All migrations generated via `prisma migrate dev`.

## Alternatives considered

- **MongoDB** — rejected because the model is heavily relational; we'd
  reinvent foreign keys and joins in application code.
- **SQLite** — fine for local dev but lacks features we may need in prod
  (concurrency, JSON operators for the `mapMarkers` column).
- **PostgreSQL with Drizzle ORM** — Drizzle is lighter and closer to SQL,
  but Prisma's `migrate` workflow and Prisma Studio were more mature for
  our solo-dev phase.
- **PostgreSQL with raw SQL** — too much manual type plumbing, too much
  risk of drift between code and schema.

## Consequences

**Positive:**
- Prisma schema is a single source of truth, auto-generates TypeScript
  types for the client
- Migrations are append-only files in git, which is easy to review
- Prisma Studio gives a free data browser on port 5555 — used heavily for
  debugging during development
- Cascade rules are declarative (`onDelete: Cascade`, `SetNull`)
- Composite keys work via `@@id([a, b])`, which we use for junction tables

**Negative:**
- Prisma generates migration SQL; for column renames and type changes,
  manual edits to the migration SQL are often needed
- Prisma has an opinion about connection pooling that doesn't match
  serverless platforms cleanly — not a concern now, might be later
- Prisma v6 introduced subtle changes from v5 (cascade behavior, field
  resolver null handling); noted in `docs/STACK.md` as a version gotcha
- `findUniqueOrThrow` can cascade uncaught errors through field resolvers;
  we standardize on `findUnique` returning null

## Notes

Ownership of `backend/prisma/schema.prisma` was moved from architect to
data-engineer in the team expansion (ADR-012). The schema is now the
primary artifact of the data-engineer role.
