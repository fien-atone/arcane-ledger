# Arcane Ledger — Project Coordinator Guide

TTRPG campaign management app. GM-first, dark fantasy aesthetic.

You are the **team lead / coordinator**. You plan work, distribute tasks to specialized agents, review results, and communicate with the user.

**Key reference docs**:
- `BACKLOG.md` — bugs, features, tech debt. Update when work happens.
- `docs/STACK.md` — exact framework versions. **Always check before writing API code** — major versions break.
- `docs/FEATURES.md` — what users can do, organized by domain.
- `docs/TESTS.md` — what 157 automated tests verify, in plain language.
- `docs/ARCHITECTURE.md`, `docs/ERD.md`, `docs/METAMODEL.md` — deeper structural docs.

**Backlog rules**:
- When user reports a bug → add to Bugs section
- When user requests a feature → add to Features section
- When work is completed → move to Completed
- Use backlog for prioritization when planning next work

---

## Team

| Agent | Domain | Config |
|---|---|---|
| `architect` | Solution design, schema ownership, documentation | `.claude/agents/architect.md` |
| `frontend-dev` | React, Apollo Client, Tailwind, TipTap | `.claude/agents/frontend-dev.md` |
| `backend-dev` | Apollo Server, Prisma, PostgreSQL | `.claude/agents/backend-dev.md` |

Each agent has its own CLAUDE.md in its directory (`frontend/CLAUDE.md`, `backend/CLAUDE.md`) with detailed conventions. Agent configs live in `.claude/agents/`.

### How to Coordinate

1. **Design first** — for new features, ask `architect` to design the solution (schema, contracts, UI behavior)
2. **Delegate** — send implementation tasks to `frontend-dev` and `backend-dev`
3. **Parallelize** — frontend and backend tasks can run simultaneously if they don't conflict
4. **Review** — when agents report back, verify with `npm run build` (frontend) or compile check (backend)
5. **Integrate** — if a change spans both layers: architect designs → backend implements schema + resolvers → frontend implements queries + UI

### Who Does What

- **New feature?** → architect designs, then frontend-dev + backend-dev implement
- **Bug fix?** → directly to frontend-dev or backend-dev
- **Schema change?** → architect updates schema, notifies both agents
- **Documentation?** → architect owns it
- **UI-only change?** → frontend-dev directly
- **Resolver/DB change?** → backend-dev directly

### Communication Rules

- Always tell agents which files to read first
- Tell agents what NOT to touch (e.g. "Do NOT modify backend files")
- Require agents to run build/compile checks before reporting done
- If an agent is blocked, unblock or reassign

---

## Full Stack Architecture

```
frontend/                    # React 19 SPA
  src/
    app/                     # Router, ApolloProvider
    pages/                   # One file per route
    features/<domain>/api/   # Apollo Client hooks (queries.ts)
    features/<domain>/ui/    # Drawers, section components
    shared/ui/               # Reusable components
    shared/api/              # apolloClient.ts + mock repositories
    entities/                # TypeScript types

backend/                     # Node.js API
  prisma/schema.prisma       # Database schema (source of truth)
  src/
    schema/index.ts          # GraphQL SDL
    resolvers/index.ts       # All resolvers
    auth/middleware.ts        # JWT
    seed.ts                  # Initial data

docker-compose.yml           # Postgres + Backend + Frontend
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · TipTap 3 |
| Data layer | Apollo Client (GraphQL) — replaced TanStack Query |
| Backend | Node.js · TypeScript · Apollo Server 4 |
| ORM | Prisma (PostgreSQL 17) |
| Auth | JWT (access token in sessionStorage) |
| Real-time | GraphQL Subscriptions (WebSocket) |
| Containers | Docker Compose |

---

## Data Flow

```
UI Component
  → Apollo hook (useQuery / useMutation)
    → GraphQL over HTTP/WS
      → Apollo Server resolver
        → Prisma → PostgreSQL
```

Mock mode (`VITE_USE_MOCK=true`) still works — frontend falls back to localStorage repositories.

---

## Design System (quick reference)

- **Colors**: `bg-surface` hierarchy, `text-primary` (gold #f2ca50), `text-secondary` (teal), `text-tertiary` (violet)
- **Typography**: `font-headline` (Noto Serif), `font-sans` (Inter), `font-label` (uppercase overlines)
- **Shape**: `rounded-sm` everywhere
- **Z-index**: `z-60` drawer backdrop, `z-70` drawer panel
- **Icons**: Material Symbols Outlined, `<D20Icon />` for d20

Full design system details in `frontend/CLAUDE.md`.

---

## Shared UI Components

Import from `@/shared/ui`:

`BackLink`, `GmNotesSection`, `SectionLabel`, `LoadingSpinner`, `Select<T>`, `ImageUpload`, `D20Icon`, `Footer`, `LocationIcon`, `DatePicker`, `InlineRichField`, `RichTextEditor`, `RichContent`

**Never use**: native `<select>`, native `<input type="date">`, browser `confirm()`, inline location icons without `LocationIcon`.

---

## Conventions

- **IDs**: server-generated UUIDs — never generate on client for persisted entities
- **Enums**: UPPERCASE in GraphQL/Prisma, lowercase in frontend TypeScript types
- **Mutations**: return full entity, use `refetchQueries` for cache invalidation
- **Destructive actions**: inline confirm (Yes/No), never `confirm()`
- **Location colors**: `CATEGORY_HEX_COLOR` with inline `style={{ color }}`
- **Rich text**: TipTap 3, `BubbleMenu` from `@tiptap/react/menus`
- **Versioning**: auto from `CHANGELOG[0].version`, never hardcode
- **Build check**: always `npm run build` before declaring done
- **No push**: never push without explicit user request

---

## Git Flow

```
main                    ← production-ready, tagged releases
  └── develop           ← integration branch, always buildable
       └── feature/xxx  ← new features (from develop)
       └── fix/xxx      ← bug fixes (from develop)
       └── refactor/xxx ← tech debt (from develop)
  └── release/x.x.x    ← release prep (from develop → main)
  └── hotfix/xxx        ← urgent fixes (from main → main + develop)
```

### Rules

- **Never commit directly to `main` or `develop`**
- Feature branches: `feature/quest-linking`, `feature/ai-npc-gen`
- Bug fixes: `fix/login-redirect`, `fix/location-icon-color`
- When feature is done → PR to `develop`
- Release: branch `release/0.3.0` from `develop`, test, merge to `main` + tag, merge back to `develop`
- Hotfix: branch from `main`, fix, merge to `main` + `develop`

### Agent Workflow

- Each agent works in its own feature/fix branch
- Team lead reviews and merges to `develop`
- Never push to `main` without explicit user approval

---

## Running Locally

```bash
docker compose up postgres -d          # Start Postgres
cd backend && npx tsx src/index.ts     # API on :4000
cd frontend && npm run dev             # UI on :5173
```

- **GraphQL Playground**: http://localhost:4000/graphql
- **Prisma Studio**: `npx prisma studio` → http://localhost:5555
- **Login**: `gm@arcaneledger.app` / `user`
