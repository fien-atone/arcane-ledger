# Agent Team — Arcane Ledger

Ten specialized agents plus team-lead (main Claude Code session).

See [ADR-012](../../docs/adrs/ADR-012-specialized-team-agents.md) for the
rationale behind this team structure.

## Team roster

| Agent | Role | Config |
|---|---|---|
| `product-manager` | Backlog, specs, estimates, retrospectives | [product-manager.md](product-manager.md) |
| `architect` | **Escalation only** — fundamental architecture decisions + ADRs | [architect.md](architect.md) |
| `data-engineer` | Prisma schema, migrations, seed, ERD, METAMODEL | [data-engineer.md](data-engineer.md) |
| `backend-dev` | GraphQL resolvers, auth, business logic | [backend-dev.md](backend-dev.md) |
| `frontend-dev` | React, Apollo Client, components, pages | [frontend-dev.md](frontend-dev.md) |
| `qa-engineer` | Integration/regression/E2E tests | [qa-engineer.md](qa-engineer.md) |
| `tech-writer` | Project docs, drift audits | [tech-writer.md](tech-writer.md) |
| `security-engineer` | Pre-merge security gate, threat model, attacking tests | [security-engineer.md](security-engineer.md) |
| `i18n-curator` | Translation keys, quality, EN/RU sync | [i18n-curator.md](i18n-curator.md) |
| `ux-designer` | UX design + review, microcopy | [ux-designer.md](ux-designer.md) |

## When to call whom

### Product and planning

- **New idea from user?** → product-manager (capture in BACKLOG)
- **Starting a feature?** → product-manager (write spec)
- **Feature merged?** → product-manager (close spec, update metrics)
- **"Is this a bug or a feature?"** → product-manager (triage)
- **Periodic backlog hygiene?** → product-manager

### Architecture

- **New subsystem (AI, real-time, offline sync)?** → architect
- **Stack change (framework version, new DB)?** → architect
- **Cross-cutting refactor (10+ files, multiple domains)?** → architect
- **Fundamental data-model rework (not "add a field")?** → architect
- **data-engineer, backend-dev, frontend-dev can't agree?** → architect
- **Anything else?** → NOT architect. The team works without them.

### Data

- **Add a field to a model?** → data-engineer
- **Write a migration?** → data-engineer
- **Seed data is wrong?** → data-engineer
- **ERD or METAMODEL out of sync?** → data-engineer
- **New index or cascade rule?** → data-engineer

### Backend

- **New resolver?** → backend-dev
- **Auth change?** → backend-dev + security-engineer (gate)
- **Fix a backend bug?** → backend-dev (with failing test first)
- **New GraphQL type or query?** → backend-dev (coordinate with data-engineer if new field)

### Frontend

- **New page, new drawer, new component?** → frontend-dev (with ux-designer for design)
- **Fix a frontend bug?** → frontend-dev
- **Refactor a component?** → frontend-dev
- **Shared primitive change?** → frontend-dev (carefully, with team-lead review)

### Tests

- **Need integration or E2E tests?** → qa-engineer
- **Bug found in production — want a regression test?** → qa-engineer (test first, then dev fixes)
- **Review dev-written tests?** → qa-engineer

### Docs

- **Feature merged, update `FEATURES.md` / `STACK.md` / `TESTS.md`?** → tech-writer (with explicit brief)
- **Docs are stale, need an audit?** → tech-writer
- **New rule for agents to follow?** → tech-writer updates CLAUDE.md
- **New ADR?** → architect (not tech-writer)

### Security

- **Touching auth, permissions, input, files, external APIs?** → security-engineer (mandatory gate)
- **Found a vulnerability in runtime?** → security-engineer writes regression test
- **CVE in a dependency, relevant to us?** → security-engineer
- **Periodic security audit?** → security-engineer

### i18n

- **New user-facing strings added to `en/`?** → i18n-curator (mirror to RU)
- **Translation reported as wrong?** → i18n-curator
- **Periodic translation quality review?** → i18n-curator

### UX

- **New page or new user flow?** → ux-designer (design phase, before dev)
- **frontend-dev has a UX question mid-implementation?** → ux-designer (peer consultation via team-lead)
- **Review UI implementation before merge?** → ux-designer (review phase)
- **Microcopy for a new error / tooltip / empty state?** → ux-designer

## How to read an agent config

Every agent config follows the same structure:

1. **Frontmatter** — name, description, tools the agent has access to
2. **Role** — what they do, in prose
3. **What You Own** — files and directories they edit
4. **What You Do NOT Own** — explicit turf boundaries
5. **How you work** — scenarios showing typical invocations
6. **Guard Rails** — numbered hard rules ("NEVER X"). This is the most
   important section: it's the last line of defense against role drift.

When team-lead delegates a task to an agent, the agent reads its own
config at the start. The Guard Rails section is load-bearing — it's
what prevents an agent from silently expanding its scope.

## Modifying agent configs

If an agent needs a rule change, edit the file directly and commit. The
configs are versioned in git precisely so team-lead can tune them over
time without losing history.

Rules for modification:
- **Don't delete guard rails** — only add or refine them
- **Don't remove "what you do NOT own" entries** unless a deliberate
  role change is happening and it's captured in an ADR
- **Do add new scenarios** as patterns emerge from real usage

## History of team changes

- **2026-04-10** — initial 10-agent team formalized (ADR-012). Before this
  date, the team was 3 agents (architect, frontend-dev, backend-dev)
  and the architect did much more than they do now.
