# Arcane Ledger — System Architecture

> v1.0 — 27.03.2026
> Актуальный документ системной архитектуры. Поддерживается архитектором.

---

## Overview

Arcane Ledger — веб-приложение для управления TTRPG-кампаниями. GM-first подход: мастер видит всё, игрок видит публичную часть.

```
┌─────────────────────────────────────────────┐
│                   Client                     │
│  React 19 · Apollo Client · Tailwind v4      │
│  Vite 8 · TipTap 3                           │
└──────────────┬──────────────────────────────┘
               │ GraphQL (HTTP + WebSocket)
┌──────────────▼──────────────────────────────┐
│                   Server                     │
│  Node.js · Apollo Server 4 · JWT Auth         │
└──────────────┬──────────────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────────────┐
│                 Database                     │
│  PostgreSQL 17 (Docker)                       │
└─────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | React | 19 |
| Language | TypeScript | 5.9 (strict) |
| Bundler | Vite | 8 |
| Styling | Tailwind CSS | v4 |
| Rich text | TipTap | 3 |
| GraphQL client | Apollo Client | 3.x |
| Backend runtime | Node.js | 22 |
| GraphQL server | Apollo Server | 4 |
| ORM | Prisma | 6.x |
| Database | PostgreSQL | 17 |
| Auth | JWT | jsonwebtoken |
| Containers | Docker Compose | — |

---

## Frontend Architecture

### Feature-Sliced Design (FSD)

```
frontend/src/
  app/              # Router, ApolloProvider, layout shells
  pages/            # One file per route (fat pages, compose from features)
  widgets/          # Cross-cutting UI: Sidebar, Topbar, DiceRoller
  features/         # Domain slices:
    campaigns/      #   api/queries.ts — Apollo hooks
    sessions/       #   ui/ — drawers, sections
    npcs/           #   model/ — Zustand stores (auth only)
    locations/
    quests/
    groups/
    groupTypes/
    locationTypes/
    species/
    relations/
    characters/
    auth/
  shared/
    ui/             # Reusable components (Select, DatePicker, LocationIcon...)
    api/            # apolloClient.ts + mock repositories (legacy)
    changelog/      # Version entries
  entities/         # TypeScript type definitions
```

### Data Flow

```
Page → Apollo hook (useQuery/useMutation)
        → gql query → HTTP → Apollo Server → Prisma → PostgreSQL
        ← data ← normalized cache ← re-render
```

Mock mode (`VITE_USE_MOCK=true`) — falls back to localStorage repositories. No backend needed.

---

## Backend Architecture

### Structure

```
backend/
  prisma/
    schema.prisma       # Source of truth — all models, relations, enums
    migrations/         # Auto-generated SQL migrations
  src/
    index.ts            # Entry: Express + Apollo Server + WebSocket
    context.ts          # { prisma, user } context type
    schema/
      index.ts          # GraphQL SDL (types, queries, mutations, subscriptions)
    resolvers/
      index.ts          # All resolvers in one file
    auth/
      middleware.ts     # JWT sign/verify/authenticate
    seed.ts             # Seed: user, location types, species
```

### GraphQL Schema Design

- **Queries** — read operations, one per entity type + list variants
- **Mutations** — upsert pattern: `id` arg provided → update, else create
- **Subscriptions** — planned: `campaignUpdated`, `sessionChanged`, etc.
- **Field resolvers** — lazy load relations (N+1 acceptable for now, DataLoader later)

### Database Schema

16 models with these key relationships:

```
User ←→ CampaignMember ←→ Campaign
Campaign → Session, NPC, Quest, Group, Location, Relation, PlayerCharacter
NPC → NPCLocationPresence → Location
NPC → NPCGroupMembership → Group
NPC → Quest (as giver)
Session ←→ NPC, Location, Quest (junction tables)
Location → Location (self-referencing hierarchy)
Relation (polymorphic: npc/character/group ↔ npc/character/group)
```

Global (not per-campaign): LocationType, GroupType, Species

---

## Auth Model

```
User → CampaignMember (role: GM | PLAYER) → Campaign
```

- JWT access token in `sessionStorage` under key `auth_token`
- Apollo Client adds `Authorization: Bearer <token>` header
- Server extracts user from JWT in context middleware
- Role is per-campaign (one user can be GM in one, Player in another)

---

## Design System

| Aspect | Value |
|---|---|
| Primary color | Gold `#f2ca50` |
| Secondary color | Teal `#7bd6d1` |
| Tertiary color | Violet `#d0c8ff` |
| Headlines font | Noto Serif (`font-headline`) |
| Body font | Inter (`font-sans`) |
| Border radius | `rounded-sm` (0.125rem) everywhere |
| Icons | Material Symbols Outlined |
| Rich text | TipTap 3, inline editing via `InlineRichField` |
| Dark theme | Yes, exclusively |

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Apollo Client over TanStack Query | Normalized cache, subscriptions, single GraphQL ecosystem |
| Prisma over raw SQL/Drizzle | Type safety, auto-migrations, schema-as-code, Prisma Studio |
| PostgreSQL over MongoDB | Relational data with many cross-references |
| Feature-Sliced Design | Clear boundaries, scalable, onboarding-friendly |
| JWT in sessionStorage (not cookies) | SPA-first, no CSRF concerns, simple |
| `CATEGORY_HEX_COLOR` inline styles | Tailwind v4 CSS cascade overrides class-based colors on hover |
| Mock mode retained | Offline dev, demo, no backend dependency for UI work |
| UUID for all IDs | Standard, URL-safe, no collision risk |
| Enums UPPERCASE in GQL, lowercase in TS | Prisma/GQL convention vs frontend readability |

---

## Infrastructure

### Local Development

```bash
docker compose up postgres -d       # PostgreSQL in Docker
cd backend && npx tsx src/index.ts  # API on :4000
cd frontend && npm run dev          # UI on :5173
```

### Production (planned)

```
VPS / Cloud (Hetzner / DigitalOcean / Railway)
  ├── nginx (reverse proxy, static frontend)
  ├── Node.js backend (Docker container)
  └── PostgreSQL (managed or Docker)
```

---

## Future Architecture (planned)

- **GraphQL Subscriptions** — real-time updates via WebSocket
- **Role-based field visibility** — resolvers filter GM-only fields for players
- **AI Service** — Claude API for NPC generation, session summaries
- **OAuth** — Google/Discord login alongside JWT
- **DataLoader** — batch N+1 queries in resolvers
