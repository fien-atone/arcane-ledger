# Architecture Decision Records

One file per significant architectural decision. Format inspired by Michael
Nygard's original ADR proposal, simplified for this project.

**Maintained by:** architect (and, when writing retrospective ADRs, team-lead)

## Why ADRs

Code without ADRs is archaeology. Six months from now, when someone asks "why
do we use Apollo Client over TanStack Query?" or "why are reference tables
per-campaign and not global?", the answer must be findable without guessing.
ADRs are how we make those answers findable.

An ADR captures:
1. **Context** — what was the situation that forced a decision
2. **Decision** — what we chose to do, stated directly
3. **Alternatives considered** — what else was on the table, why we didn't pick them
4. **Consequences** — what this commits us to, both good and bad

If an ADR doesn't have all four, it's incomplete.

## When to write one

Write an ADR for:
- Every new subsystem
- Every stack change
- Every cross-cutting refactor (the refactor plan IS the ADR)
- Every fundamental data-model change
- Every resolved architectural arbitration

Do NOT write an ADR for:
- Routine feature work
- Bug fixes
- Refactors inside one domain
- Single-page UX choices
- Code style preferences

The test: "if someone six months from now asks 'why did we do X', is the
answer worth a dedicated document?" If yes → ADR. If no → don't.

## Numbering

Sequential from 001. Never reused. A superseded ADR keeps its number; its
status becomes `Superseded by ADR-XXX`. We don't delete ADRs.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| [ADR-001](ADR-001-graphql-apollo-over-rest.md) | GraphQL with Apollo Client and Apollo Server over REST | Accepted | 2026-03-27 (retro) |
| [ADR-002](ADR-002-prisma-postgres.md) | Prisma + PostgreSQL as the persistence stack | Accepted | 2026-03-27 (retro) |
| [ADR-003](ADR-003-feature-sliced-design.md) | Feature-Sliced Design for the frontend | Accepted | 2026-03-24 (retro) |
| [ADR-004](ADR-004-jwt-session-storage.md) | JWT in sessionStorage, not cookies | Accepted | 2026-03-27 (retro) |
| [ADR-005](ADR-005-per-campaign-reference-tables.md) | Reference tables are per-campaign, not global | Accepted | 2026-03-30 (retro) |
| [ADR-006](ADR-006-visibility-system.md) | Two-layer visibility: entity-level and field-level | Accepted | 2026-04-01 (retro) |
| [ADR-007](ADR-007-section-widgets-pattern.md) | Section widgets: thin pages composing domain sections | Accepted | 2026-04-01 (retro) |
| [ADR-008](ADR-008-compound-primitives-over-config.md) | Compound components and hooks-first for shared primitives | Accepted | 2026-04-08 (retro) |
| [ADR-009](ADR-009-server-side-search-previousdata.md) | Server-side search with Apollo v4 `previousData` to prevent flicker | Accepted | 2026-04-09 (retro) |
| [ADR-010](ADR-010-mock-mode-retained.md) | Retain legacy mock mode alongside real backend | Accepted | 2026-04-10 (retro) |
| [ADR-011](ADR-011-t-shirt-estimates.md) | T-shirt sizes, never hours, for effort estimation | Accepted | 2026-04-10 (retro) |
| [ADR-012](ADR-012-specialized-team-agents.md) | Specialized agent team (10 roles) with guard rails and documentation map | Accepted | 2026-04-10 |

## Template

```markdown
# ADR-XXX: Title (decision stated as a direct claim)

**Status:** Proposed | Accepted | Superseded by ADR-YYY | Deprecated
**Date:** YYYY-MM-DD
**Decided by:** (who was in the room — team-lead, architect, user)
**Related:** ADR-A, ADR-B (if any)

## Context

What's happening, what problem are we solving, what pressures are on us.
Plain language, no marketing. 2–5 short paragraphs.

## Decision

We will do X. Stated directly, as a decision, not a proposal.

## Alternatives considered

- **Alternative A** — description, why not chosen
- **Alternative B** — description, why not chosen
- **Alternative C** — description, why not chosen

At least two alternatives. An ADR with one option considered is suspect.

## Consequences

What this commits us to, positive and negative, honestly.

- Positive: X, Y, Z
- Negative: A, B, C
- To watch: D

## Notes

Anything else worth capturing: prior art, external links, lessons learned.
```

## Retrospective ADRs

The ADRs numbered 001–011 are **retrospective** — they capture decisions that
were made earlier in the project's life, before this ADR system existed.
They're reconstructed from git history, commit messages, and the CLAUDE.md
files. They represent best-effort archaeology of what we actually decided and
why. If any of them get facts wrong, open a correction via team-lead.

From ADR-012 onward, ADRs are written at decision time.
