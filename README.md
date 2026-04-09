# Arcane Ledger

TTRPG campaign management app. GM-first, dark fantasy aesthetic.

Manage NPCs, locations, sessions, quests, groups, species, and social relations — all in one place. Built for Game Masters who want to keep their world organized.

See [docs/](docs/) for architecture, product vision, data model, features, and test coverage.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · TypeScript · Vite 8 · Tailwind CSS v4 |
| Rich text | TipTap 3 |
| Backend | Node.js · TypeScript · Apollo Server (GraphQL) |
| ORM | Prisma |
| Database | PostgreSQL 17 |
| Auth | JWT (access token) |
| Real-time | GraphQL Subscriptions (WebSocket) |
| Containerization | Docker Compose |

---

## Prerequisites

- **Node.js** 22+
- **Docker** runtime — [OrbStack](https://orbstack.dev) (recommended for Mac) or [Docker Desktop](https://docker.com)
- **npm** (comes with Node.js)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/fien-atone/arcane-ledger.git
cd arcane-ledger
```

### 2. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 3. Setup backend

```bash
cd backend
npm install
cp .env.example .env          # adjust if needed
npx prisma migrate dev        # create tables + seed data
npx tsx src/index.ts           # start API on :4000
```

API available at `http://localhost:4000/graphql`

### 4. Start frontend

```bash
cd frontend
npm install
npm run dev                    # start on :5173
```

Open `http://localhost:5173`

### 5. Login

Default credentials (created by seed):
- **Email:** `gm@arcaneledger.app`
- **Password:** `user`

---

## AI Development Team

This project uses Claude Code with a multi-agent team:

| Agent | Role | Config |
|---|---|---|
| Team Lead | Coordinator, task distribution | `CLAUDE.md` |
| Architect | Solution design, schema ownership, docs | `.claude/agents/architect.md` |
| Frontend Dev | React, Apollo Client, UI | `.claude/agents/frontend-dev.md` |
| Backend Dev | Apollo Server, Prisma, DB | `.claude/agents/backend-dev.md` |

Task tracking in `BACKLOG.md`.

---

## Development Modes

### Mock mode (no backend needed)

Frontend works standalone with localStorage data:

```bash
cd frontend
npm run dev
# VITE_USE_MOCK defaults to 'true'
```

### Full stack mode

Set in `frontend/.env`:

```env
VITE_USE_MOCK=false
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

---

## Docker Compose (full stack)

```bash
docker compose up
```

This starts:
- **postgres** on `:5432`
- **backend** on `:4000`
- **frontend** on `:3000`

---

## Project Structure

```
arcane-ledger/
├── frontend/                # React SPA
│   └── src/
│       ├── app/             # Router, providers, layout
│       ├── pages/           # One file per route
│       ├── widgets/         # Sidebar, Topbar, DiceRoller
│       ├── features/        # Domain slices (npcs, sessions, quests...)
│       ├── shared/          # Reusable UI, API layer, changelog
│       └── entities/        # TypeScript types
├── backend/                 # Apollo Server
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── src/
│       ├── schema/          # GraphQL type definitions
│       ├── resolvers/       # Query + Mutation resolvers
│       ├── auth/            # JWT middleware
│       ├── seed.ts          # Database seed script
│       └── index.ts         # Server entry point
├── docs/                    # All project documentation
│   ├── ARCHITECTURE.md      #   system architecture
│   ├── PRODUCT.md           #   product vision, personas, positioning
│   ├── STACK.md             #   exact framework versions + gotchas
│   ├── ERD.md               #   entity relationship diagram (Mermaid)
│   ├── METAMODEL.md         #   domain concepts and business rules
│   ├── FEATURES.md          #   what users can do, by domain
│   ├── TESTS.md             #   test inventory in plain language
│   ├── REFACTOR_PLAN.md     #   historical refactor tracker
│   ├── metrics/             #   feature effort log (t-shirt sizes)
│   └── specs/               #   per-feature specs (F-XX.md)
├── .claude/
│   └── agents/              # AI agent configs (versioned in git)
│       ├── architect.md
│       ├── frontend-dev.md
│       ├── backend-dev.md
│       ├── product-manager.md
│       ├── qa-engineer.md
│       └── tech-writer.md
├── docker-compose.yml
├── CLAUDE.md                # Team coordinator guide (root)
├── BACKLOG.md               # Bugs, features, tech debt tracker
└── README.md
```

---

## Key Features

- **Campaigns** — create, archive, restore. Inline title/description editing
- **NPCs** — full CRUD, portraits, status, species, appearance, personality, locations, group memberships
- **Locations** — hierarchical (parent/child), location types with category colors, interactive map editor with markers
- **Sessions** — create/edit/delete, brief (public) + GM notes (private), NPC/location/quest links
- **Quests** — status tracking (Undiscovered → Active → Completed/Failed), quest giver, rewards
- **Groups** — factions and organizations with NPC memberships
- **Social Relations** — directional relationships with 5-level attitude (Hostile → Allied), BG3-style bars
- **Species & Types** — configurable location types, group types, species with containment rules
- **Rich Text** — TipTap editor for all text fields, inline editing everywhere
- **Dark Theme** — dark fantasy aesthetic, Material Symbols icons, custom DatePicker

---

## Database

### Migrations

```bash
cd backend
npx prisma migrate dev --name description_of_change
```

### Studio (visual DB browser)

```bash
npx prisma studio
```

### Reset

```bash
npx prisma migrate reset    # drops all data, re-runs migrations + seed
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://arcane:arcane_dev_pass@localhost:5432/arcane_ledger` | PostgreSQL connection |
| `JWT_SECRET` | `dev-secret-change-in-production` | JWT signing secret |
| `PORT` | `4000` | Server port |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_USE_MOCK` | `true` | Use localStorage mock data |
| `VITE_GRAPHQL_URL` | — | GraphQL HTTP endpoint |
| `VITE_GRAPHQL_WS_URL` | — | GraphQL WebSocket endpoint |

---

## Useful Links (local dev)

| What | URL | Notes |
|---|---|---|
| Frontend | http://localhost:5173 | Vite dev server (`npm run dev`) |
| GraphQL Playground | http://localhost:4000/graphql | Apollo Sandbox — queries, mutations, schema explorer |
| Prisma Studio | http://localhost:5555 | Visual DB browser (`npx prisma studio`) |
| PostgreSQL | localhost:5432 | User: `arcane`, DB: `arcane_ledger` |

### Useful commands

```bash
# Backend
cd backend
npx tsx src/index.ts           # start API server
npx prisma studio              # visual DB browser
npx prisma migrate dev         # apply schema changes
npx prisma migrate reset       # nuke & recreate DB
npx tsx src/seed.ts             # seed initial data

# Frontend
cd frontend
npm run dev                     # start dev server
npm run build                   # production build (also type-checks)

# Docker
docker compose up postgres -d   # start Postgres
docker compose down             # stop everything
docker compose up               # start full stack
```

---

## License

Private. All rights reserved.
