# Arcane Ledger — System Architecture

**Last updated**: 2026-04-10

A web app for managing tabletop RPG campaigns. GM-first: the Game Master sees
everything, players see what the GM chooses to share.

**Related docs:**
- [STACK.md](STACK.md) — exact framework versions and API gotchas
- [ERD.md](ERD.md) — entity relationship diagram (Mermaid)
- [METAMODEL.md](METAMODEL.md) — domain concepts and business rules
- [FEATURES.md](FEATURES.md) — what users can do, organized by domain
- [PRODUCT.md](PRODUCT.md) — product vision, personas, positioning

---

## High-Level Overview

```
┌─────────────────────────────────────────────┐
│                   Client                    │
│  React 19 · Apollo Client 4 · Tailwind v4   │
│  Vite 8 · TipTap 3                          │
└──────────────┬──────────────────────────────┘
               │ GraphQL (HTTP + WebSocket)
┌──────────────▼──────────────────────────────┐
│                   Server                    │
│  Node.js 22 · Apollo Server 4 · JWT Auth    │
└──────────────┬──────────────────────────────┘
               │ Prisma ORM
┌──────────────▼──────────────────────────────┐
│                 Database                    │
│          PostgreSQL 17 (Docker)             │
└─────────────────────────────────────────────┘
```

All versions above are approximate — see [STACK.md](STACK.md) for the exact pinned versions.

---

## Data Flow

```
UI Component
  → Apollo hook (useQuery / useMutation)
    → gql query over HTTP or WS
      → Apollo Server resolver
        → Prisma → PostgreSQL
      ← data
    ← normalized cache
  ← re-render
```

Mock mode (`VITE_USE_MOCK=true`) falls back to localStorage repositories for a
few detail hooks. This is a legacy path retained for offline demos; the
primary and tested path is the real backend.

---

## Frontend

### Feature-Sliced Design (FSD)

```
frontend/src/
├── app/                   # Router, ApolloProvider, layout shells
├── pages/                 # One file per route — thin orchestrators composing sections
├── widgets/               # Cross-cutting UI: Sidebar, Topbar, DiceRoller, landing sections
│
├── features/              # Domain slices, each self-contained:
│   └── <domain>/
│       ├── api/queries.ts # Apollo hooks (queries, mutations, subscriptions)
│       ├── hooks/         # Page-level and detail-level custom hooks
│       ├── sections/      # Section widgets — the building blocks of pages
│       ├── ui/            # Drawers, edit forms
│       └── model/         # Zustand stores (auth only)
│
├── shared/
│   ├── ui/                # Reusable presentational components (Select, DatePicker,
│   │                      # SectionPanel, FormDrawer, InlineConfirm, form.ts, etc.)
│   ├── hooks/             # Reusable hooks (useDebouncedSearch, useInlineConfirm,
│   │                      # useLinkedEntityList)
│   ├── api/               # apolloClient.ts, subscription wiring
│   └── changelog/         # Version entries
│
└── entities/              # TypeScript type definitions
```

### Page composition — Section Widgets

Pages do not contain business logic or rendering detail. Each page is a **thin orchestrator**:

1. Read route params
2. Load the root entity via a custom hook (`useNpcDetail`, `useLocationListPage`, …)
3. Compose section widgets that each fetch their own data and own their own state

This architecture was established in the Tier 1–3 refactor (22 pages decomposed; see [REFACTOR_PLAN.md](REFACTOR_PLAN.md) for history). The 22 decomposed pages shrunk from 9898 LoC to 2314 LoC total.

Rules for section widgets live in [frontend/CLAUDE.md](../frontend/CLAUDE.md).

### Shared primitives (Phase 2 redundancy audit)

After the decomposition, a redundancy audit extracted these shared primitives in `shared/ui/` and `shared/hooks/`:

| Primitive | Kind | Replaces |
|---|---|---|
| `SectionPanel` | compound-free component | 83+ hand-rolled card-panel wrappers |
| `InlineConfirm` + `useInlineConfirm` | hook + tiny component | 19 hand-rolled "Yes/No" dialogs |
| `LABEL_CLS`, `INPUT_CLS`, `toArray`, `fromArray` in `form.ts` | constants + helpers | 15 copy-pasted drawer top-of-file definitions |
| `FormDrawer` + `Header/Body/Footer` subcomponents | compound component | 11 drawer outer-chrome duplications |
| `useLinkedEntityList` | hook | linked-entity picker state across 8 sections |
| `useDebouncedSearch` | hook | debounced search input for server-side filtering (F-11) |

---

## Backend

### Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Source of truth — all models, relations, enums
│   └── migrations/         # Auto-generated SQL migrations
└── src/
    ├── index.ts            # Entry: Express + Apollo Server + WebSocket
    ├── context.ts          # { prisma, user } context
    ├── schema/
    │   └── index.ts        # GraphQL SDL (types, queries, mutations, subscriptions)
    ├── resolvers/          # Domain-split resolvers (npcs.ts, locations.ts, …)
    ├── auth/
    │   └── middleware.ts   # JWT sign/verify/authenticate
    ├── seed.ts             # Full Drakkenheim seed (~1675 lines, 9 users, 52 NPCs, etc.)
    └── __tests__/          # Vitest tests (security/, functional/)
```

### GraphQL Schema Design

- **Queries** — read operations, one per entity type + list variants.
- **Mutations** — upsert pattern: `id` arg provided → update, else create. Returns full entity.
- **Subscriptions** — real-time updates via WebSocket. One channel per campaign with targeted invalidation.
- **Field resolvers** — lazy load relations. `DataLoader` is used where N+1 was observed (invitations, location children).

### Database Schema

Key relationships:

```
User ←→ CampaignMember ←→ Campaign
Campaign → Session, NPC, Quest, Group, Location, Relation, PlayerCharacter
Campaign → LocationType, GroupType, Species, SpeciesType   (per-campaign, not global)
NPC → NPCLocationPresence → Location
NPC → NPCGroupMembership → Group
NPC → Quest (as giver)
Session → SessionNPC / SessionLocation / SessionQuest (junction tables)
Session → SessionNote (per-user session notes)
Location → Location (self-referencing hierarchy via parentLocationId)
Location → LocationTypeContainmentRule (validated hierarchy)
Relation (polymorphic: npc/character/group ↔ npc/character/group)
```

All reference tables (`LocationType`, `GroupType`, `Species`, `SpeciesType`) are **per-campaign**, not global. The architect docs before 2026-03-30 described them as global — that is out of date.

See [ERD.md](ERD.md) for the complete Mermaid diagram.

---

## Auth Model

```
User → CampaignMember (role: GM | PLAYER) → Campaign
User.role (system-wide: USER | ADMIN)
```

- JWT access token stored in `sessionStorage` under key `auth_token`
- Apollo Client adds `Authorization: Bearer <token>` via `setContext` link
- Server extracts user from JWT in the context middleware
- `User.role` is a **system-wide** role (`USER` / `ADMIN`). `ADMIN` users can manage other users and see the admin panel.
- `CampaignMember.role` is a **per-campaign** role (`GM` / `PLAYER`). One user can be GM in one campaign and Player in another.
- All mutations enforce `GM` role checks via `requireGM` helper (backend test suite verifies this on every mutation — see [TESTS.md](TESTS.md)).

---

## Visibility System

One of the central features. Implemented in 0.3.0.

- Every domain entity (NPC, Location, Quest, Group, Session) has `playerVisible: boolean` and `playerVisibleFields: string[]`.
- GM toggles visibility per-entity or per-field.
- Field-level visibility: "players know this NPC exists but not their motivation".
- Party module acts as a gate: visibility controls are only exposed when the Party section is enabled for the campaign.
- Resolvers filter `playerVisibleFields` on the server side, so sensitive data never reaches the player client.

---

## Real-Time Updates

GraphQL Subscriptions via WebSocket (`graphql-ws`). Implemented in 0.3.0.

- Per-campaign subscription channels: when anything changes in a campaign, all connected clients refetch relevant queries.
- Granular invalidation: `CampaignSubscriptionManager` maps subscription events to specific queries to refetch.
- Used for: real-time NPC edits, session updates, quest status changes, member join/leave.

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
| Theme | Dark theme exclusively |

Full design system details in [frontend/CLAUDE.md](../frontend/CLAUDE.md).

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Apollo Client over TanStack Query | Normalized cache, subscriptions, single GraphQL ecosystem |
| Prisma over raw SQL / Drizzle | Type safety, auto-migrations, schema-as-code, Prisma Studio |
| PostgreSQL over MongoDB | Relational data with many cross-references |
| Feature-Sliced Design | Clear domain boundaries, scalable, onboarding-friendly |
| Section widgets pattern | Prevents god-components, enables isolated testing, clear ownership |
| JWT in sessionStorage (not cookies) | SPA-first, no CSRF concerns, simple |
| `CATEGORY_HEX_COLOR` inline styles | Tailwind v4 cascade overrides class-based colors on hover |
| Server-side search (F-11) | Scales to large campaigns, debounced 300ms with Apollo v4 `previousData` keep-alive to prevent flicker |
| UUID for all IDs | Standard, URL-safe, no collision risk, never generated client-side for persisted entities |
| Enums UPPERCASE in GraphQL/Prisma, lowercase in TypeScript | Prisma convention vs frontend readability (see T-3 in BACKLOG — still fragile) |
| Mock mode retained | Offline dev demo, no backend dependency for UI-only work |

---

## Testing Strategy

See [TESTS.md](TESTS.md) for the full test inventory.

| Tier | Runner | Count | Scope |
|---|---|---|---|
| Backend functional & security | Vitest + supertest | 169 | Resolvers, auth, visibility, rate limits, N+1 regression |
| Frontend component & hook | Vitest + Testing Library + Apollo MockedProvider | 367 | Sections, hooks, shared primitives |
| Frontend E2E | Playwright | 11 | Login, i18n, role visibility, XSS |

Backend tests run against a dedicated `arcane_ledger_test` database that refuses to execute if the target DB URL doesn't include `_test`.

---

## Infrastructure

### Local Development

```bash
docker compose up postgres -d       # PostgreSQL in Docker
cd backend && npx tsx src/index.ts  # API on :4000
cd frontend && npm run dev          # UI on :5173
```

Default login: `gm@arcaneledger.app` / `user` (see seed).

### Production (planned)

```
VPS / Cloud (Hetzner / DigitalOcean / Railway)
├── nginx (reverse proxy + static frontend)
├── Node.js backend (Docker container)
└── PostgreSQL (managed or Docker)
```

Frontend is currently configured for GitHub Pages deployment (basename `/arcane-ledger`).
