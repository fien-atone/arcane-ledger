# Arcane Ledger — Solution Architecture

> GM-first TTRPG campaign management app. Currently local-only (localStorage mock). Backend planned — the data layer is designed to switch without touching component code.

**Related docs:**
- [METAMODEL.md](METAMODEL.md) — domain concepts, business rules, planned extensions
- [ERD.md](ERD.md) — entity relationship diagram (Mermaid)

---

## High-Level Overview

```
Browser
└── React SPA (Vite, /arcane-ledger/ base path)
    ├── Public pages  (/, /changelog, /login)
    └── Protected app (/campaigns/*)
        ├── Zustand  — auth state, UI state (sidebar collapse)
        ├── TanStack Query — async data cache + mutations
        └── Repository layer
            ├── [current]  LocalStorage mock — all data in browser
            └── [planned]  REST API via realClient (fetch-based)
```

**Current phase:** all data lives in localStorage. The repository layer is designed to flip to a real API via `VITE_USE_MOCK=false` + `VITE_API_URL` with zero component changes.

---

## Directory Structure

```
frontend/src/
├── app/
│   ├── router.tsx          — route definitions (lazy-loaded pages)
│   ├── providers.tsx       — QueryClient setup
│   ├── App.tsx             — root component
│   └── AppLayout.tsx       — Topbar + Outlet wrapper
│
├── pages/                  — one file per route (composed, can be fat)
│
├── widgets/                — self-contained UI blocks
│   ├── Sidebar/            — campaign navigation
│   ├── Topbar/             — top header bar
│   ├── CampaignShell/      — layout wrapper for /campaigns/:id/*
│   ├── DiceRollerModal/    — floating dice roller
│   └── Changelog/          — "What's New" drawer
│
├── features/               — domain feature slices
│   └── <domain>/
│       ├── api/queries.ts  — TanStack Query hooks
│       ├── model/store.ts  — Zustand store (if needed)
│       └── ui/             — React components for this feature
│
├── shared/
│   ├── ui/                 — reusable presentational components
│   ├── api/
│   │   ├── repositories/   — data access layer (localStorage CRUD)
│   │   └── mockData/       — seed data per entity
│   └── changelog/          — CHANGELOG entries (typed array)
│
└── entities/               — TypeScript types/interfaces per domain
```

---

## Routing

Base path: `/arcane-ledger/`

### Public (no auth required)
| Path | Page |
|---|---|
| `/` | LandingPage |
| `/changelog` | ChangelogPage |
| `/login` | LoginPage |

### Protected (requires `useAuthStore` user)
| Path | Page |
|---|---|
| `/campaigns` | CampaignsPage |
| `/campaigns/:id` | CampaignDashboardPage |
| `/campaigns/:id/npcs` | NpcListPage |
| `/campaigns/:id/npcs/:npcId` | NpcDetailPage |
| `/campaigns/:id/locations` | LocationListPage |
| `/campaigns/:id/locations/:locationId` | LocationDetailPage |
| `/campaigns/:id/sessions` | SessionListPage |
| `/campaigns/:id/sessions/:sessionId` | SessionDetailPage |
| `/campaigns/:id/groups` | GroupListPage |
| `/campaigns/:id/groups/:groupId` | GroupDetailPage |
| `/campaigns/:id/quests` | QuestListPage |
| `/campaigns/:id/quests/:questId` | QuestDetailPage |
| `/campaigns/:id/party` | PartyPage |
| `/campaigns/:id/characters/:charId` | CharacterDetailPage |
| `/campaigns/:id/species` | SpeciesPage |
| `/campaigns/:id/species/:speciesId` | SpeciesDetailPage |
| `/campaigns/:id/group-types` | GroupTypesPage |
| `/campaigns/:id/materials` | MaterialsPage |

All pages are **lazy-loaded** via `React.lazy()` with a `<Suspense>` fallback.

`ProtectedRoute` wraps the authenticated section — redirects to `/login` if no user in store.

---

## State Management

Two complementary tools, different responsibilities:

### Zustand — synchronous / local UI state

| Store | Key | Purpose |
|---|---|---|
| `useAuthStore` | `arcane-auth` (localStorage) | Current user, login/logout, campaign role |
| `useCampaignUiStore` | in-memory | Sidebar collapsed state, edit mode |

Auth persists across page refreshes. UI state resets on refresh.

### TanStack Query — async / server state

```
QueryClient
  staleTime: 5 min
  retry: 1
```

All entity data flows through TanStack Query:
- `useQuery` for reads (list + detail)
- `useMutation` for writes → `invalidateQueries` on success

**Query key conventions:**
```
['campaigns']                     — all campaigns
['campaigns', campaignId]         — single campaign
['npcs', campaignId]              — NPC list
['npcs', campaignId, npcId]       — single NPC
['locations', campaignId]         — etc.
```

---

## Data Layer

### Repository pattern

Every entity has a repository at `shared/api/repositories/<entity>Repository.ts`:

```
list(campaignId?)   → Entity[]
getById(id)         → Entity
save(entity)        → Entity   (upsert)
delete(id)          → void
```

### localStorage storage

All repositories use a shared `createLocalStore()` helper:

```
Storage key:  ttrpg_<entity>   (e.g. ttrpg_npcs)
Version key:  ttrpg_<entity>_version

On version mismatch:
  1. Load existing localStorage data
  2. Separate user-created records from seed IDs
  3. Merge: [...seedData, ...userCreated]
  4. Write merged + new version
```

Current store version: `8` (bump when seed data changes incompatibly).

Seed data lives in `shared/api/mockData/`.

### Mock vs Real API toggle

```
VITE_USE_MOCK !== 'false'  →  use localStorage repositories  (current)
VITE_USE_MOCK === 'false'  →  use realClient (fetch-based HTTP)  (planned)
```

`realClient` reads `VITE_API_URL` for base URL and makes standard `GET/POST/PUT/DELETE` fetch calls expecting JSON responses. All repository method signatures stay the same — the switch is transparent to TanStack Query hooks and all components above.

**Migration path to backend:**
1. Stand up REST API matching repository method signatures
2. Set `VITE_USE_MOCK=false` and `VITE_API_URL=https://api.example.com`
3. Handle auth tokens in `realClient` (add `Authorization` header from auth store)
4. Replace Zustand auth persistence with server-issued sessions/JWT

---

## Domain Entities

All types live in `src/entities/`.

| Entity | Key Fields |
|---|---|
| `CampaignSummary` | id, title, description, coverGradient, myRole, sessionCount, memberCount |
| `PlayerCharacter` | id, campaignId, userId, name, gender, age, species, speciesId, class, background, personality, motivation, bonds, flaws, gmNotes, image |
| `NPC` | id, campaignId, name, status, gender, species, speciesId, groupMemberships, locationPresences, gmNotes, image |
| `Location` | id, campaignId, parentId, name, type (region/settlement/district/building/dungeon), gmNotes, map (image + markers) |
| `Session` | id, campaignId, number, title, datetime, brief, summary, nextSessionNotes, locationIds |
| `Quest` | id, campaignId, title, description, giverId, reward, status (active/completed/failed/unknown/unavailable) |
| `Group` | id, campaignId, name, type, description, goals, partyRelation, gmNotes, image |
| `Species` | id, name, pluralName, type, size, description, traits, image |
| `Relation` | id, campaignId, fromEntity, toEntity, friendliness (-100 to +100), note |
| `GroupTypeEntry` | id, name, icon, description |

---

## Feature Slice Structure

Each feature follows the same layout:

```
features/<domain>/
├── api/
│   └── queries.ts    — useQuery + useMutation hooks
├── model/
│   └── store.ts      — Zustand store (optional)
└── ui/
    ├── <Entity>EditDrawer.tsx   — create/edit form in a right-side drawer
    └── index.ts                 — barrel export
```

### Current features

| Feature | Has Drawer | Has Store |
|---|---|---|
| auth | — | ✓ |
| campaigns | CampaignCreateDrawer | ✓ (UI state) |
| characters | CharacterEditDrawer | — |
| npcs | NpcEditDrawer | — |
| locations | LocationEditDrawer | — |
| groups | GroupEditDrawer | — |
| groupTypes | GroupTypeEditDrawer | — |
| species | SpeciesEditDrawer | — |
| sessions | — | — |
| quests | — | — |
| relations | — (inline section) | — |
| factions | — | — |

---

## Widgets

### CampaignShell
Layout wrapper for all campaign inner pages:
```
CampaignShell
├── <Sidebar />          fixed left, collapsible (64px / 256px)
├── <DiceRoller />       floating FAB bottom-right (z-50)
└── <Outlet />           page content, margin-left adapts to sidebar width
```

### Sidebar
Navigation tree grouped into sections:
- **World**: Locations, NPCs, Species, Groups, Group Types
- **Adventure**: Sessions, Party, Quests
- **GM Screen**: Materials
- Footer: All Campaigns, What's New (changelog unread dot), Logout

### DiceRoller
- Supports d4, d6, d8, d10, d12, d20, d100
- Roll history with formula display
- Critical hit (nat 20) / critical miss (nat 1) states
- Modifier input
- All local state, no persistence

---

## Authentication

Currently mock auth — no real backend:

```
Credentials:
  user / user  →  logs in as GM (displayed as "Game Master")

Storage: localStorage key 'arcane-auth' (Zustand persist)
Survives: page refresh
Clears on: logout()
```

`getCampaignRole(campaignId)` returns `'gm' | 'player'` — currently always `'gm'` for mock users.

**Planned (with backend):** replace Zustand persist with server-issued JWT/session cookie. The `useAuthStore` interface stays the same — only the login/logout implementation changes to call the API.

---

## Shared UI Components

All in `shared/ui/`, exported from `shared/ui/index.ts`.

| Component | Purpose |
|---|---|
| `BackLink` | `chevron_left` navigation link |
| `GmNotesSection` | GM notes block (`variant: 'card' \| 'sidebar'`) |
| `SectionLabel` | `text-[10px]` uppercase overline label |
| `LoadingSpinner` | Animated spinner with text |
| `Select<T>` | Custom dropdown (dark-theme-safe, replaces `<select>`) |
| `ImageUpload` | Portrait/image upload with base64 storage + lightbox |
| `D20Icon` | SVG d20 icon (replaces `casino` Material Symbol everywhere) |
| `Footer` | Public page footer with links |

---

## Design System

Tailwind CSS v4 with `@theme` custom tokens in `index.css`.

**Color roles (Material Design 3 inspired):**
- `primary` — aged gold (`#f2ca50`) — main accent, interactive elements
- `secondary` — teal (`#7bd6d1`) — secondary actions
- `tertiary` — violet (`#d0c8ff`) — tertiary highlights
- `surface-*` — dark grey hierarchy (`#0d0e12` → `#343439`)
- `on-surface` / `on-surface-variant` — text colors

**Typography:**
- `font-headline` — Noto Serif (display text, titles)
- `font-sans` / `font-label` / `font-body` — Inter (UI text, labels, buttons)

**Shape:** Sharp corners throughout. `rounded-sm` (0.125rem) on interactive elements.

**Z-index scale (extended beyond Tailwind default):**
```
z-50  — DiceRoller FAB, dropdown menus
z-60  — Drawer backdrop
z-70  — Drawer panel
```

---

## Versioning & Changelog

- Current version: **v0.1.9**
- Entries: `shared/changelog/entries.ts` (typed `ChangelogEntry[]`, newest first)
- Public page: `/changelog`
- In-app: sidebar "What's New" → `ChangelogDrawer`
- Unread detection: `getHasUnread()` compares latest version vs last-seen in localStorage

When releasing a new version: bump the version string in the top entry, add a new entry object at the top of the array.

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| localStorage mock (current) | Zero infrastructure for early development; real backend planned |
| Repository abstraction | Backend switch happens in one layer — components and queries are untouched |
| Mock/real toggle via env var | `VITE_USE_MOCK=false` flips the entire data layer to REST API |
| TanStack Query over plain useState | Cache, deduplication, loading/error states for free |
| Zustand over Redux | Minimal boilerplate, good for small auth + UI state |
| Tailwind v4 | No config file, `@theme` in CSS, better IDE experience |
| Custom `Select` over `<select>` | Native `<select>` ignores dark-theme option styles on macOS |
| TipTap v3 | WYSIWYG inline editing; `BubbleMenu` from `@tiptap/react/menus` |
| FSD architecture | Clear ownership per feature slice; scales without cross-cutting dependencies |
