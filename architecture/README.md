# Architecture Documentation

Maintained by the `architect` agent. Source of truth for system design and contracts.

## Documents

| Document | Description |
|---|---|
| [system-architecture.md](system-architecture.md) | Full stack architecture, tech stack, key decisions |
| [data-model.md](data-model.md) | Entity relationships, field reference (mirrors Prisma schema) |
| [product.md](product.md) | Product vision, user personas, pain points |
| [requirements.md](requirements.md) | Functional requirements (MoSCoW prioritization) |
| [roadmap.md](roadmap.md) | Development phases and milestones |
| [screens.md](screens.md) | Screen-by-screen UI specifications |

## Live Sources of Truth

These files in the codebase are authoritative — docs above are summaries:

- `backend/prisma/schema.prisma` — database schema
- `backend/src/schema/index.ts` — GraphQL API contract
- `frontend/src/entities/` — TypeScript types
- `CLAUDE.md` — team coordination
- `frontend/CLAUDE.md` — frontend conventions
- `backend/CLAUDE.md` — backend conventions
