# Arcane Ledger — Backlog

Task tracker for bugs, features, and improvements. Managed by the team lead.

Legend: `🔴` critical · `🟡` important · `🟢` nice to have · `✅` done · `🚧` in progress

---

## In Progress

_Nothing currently in progress._

---

## Bugs

| # | Priority | Description | Assigned |
|---|---|---|---|
| B-1 | 🟡 | Campaign create uses client-side ID fallback if server response is slow | — |
| B-3 | 🟢 | Social relations: `char-alvin` link on NPC pages may not resolve name if party data hasn't loaded | — |

---

## Features

| # | Priority | Description | Assigned |
|---|---|---|---|
| F-1 | 🔴 | End-to-end testing: verify all pages work with GraphQL backend (not just build) | — |
| F-2 | 🟡 | Seed script: migrate mock data (NPCs, locations, sessions, quests, groups) into Postgres | — |
| F-3 | 🟡 | GraphQL subscriptions: real-time updates when data changes | — |
| F-4 | 🟡 | Role-based field visibility: hide GM Notes from players | — |
| F-5 | 🟡 | Campaign invitations: invite users to campaign as player | — |
| F-6 | 🟢 | AI: NPC generation — имя, внешность, предыстория на основе контекста кампании | — |
| F-7 | 🟢 | AI: парсинг заметок сессии в сущности — NPC, локации, квесты из свободного текста | — |
| F-13 | 🟢 | AI: генерация локаций и городов на основе типа, климата и региона | — |
| F-14 | 🟢 | AI provider: поддержка self-hosted Ollama (Qwen/Llama) как альтернатива облачным API — для офлайн и приватности | — |
| F-8 | 🟢 | Export: PDF character sheets, session summaries | — |
| F-9 | 🟢 | Dice roller: persist roll history per session | — |
| F-10 | 🟢 | OAuth login (Google/Discord) | — |
| F-11 | 🟡 | All search/filter must go through server (debounced GraphQL queries, no client-side filtering) | — |
| F-12 | 🟡 | Subtle loading indicator on all server data fetches — small non-intrusive spinner/bar so user knows data is live | — |
| F-15 | 🟡 | Timelines: visual timeline view for campaign events, session history, NPC encounters, quest progression | — |
| F-16 | 🟡 | Visibility controls conditional on Party module — show player visibility toggles (VisibilityPanel, eye icons) only when the Party section is enabled for the campaign. No party = no players = no need for visibility management | — |
| F-17 | 🟢 | Social GM groups — a group of GMs can see each other's campaigns, coordinate session schedules across multiple games, shared calendar view. For communities running multiple parallel campaigns | — |

---

## Tech Debt

| # | Priority | Description | Assigned |
|---|---|---|---|
| T-1 | 🟡 | Remove mock repositories and mockData after full backend migration | — |
| T-2 | 🟡 | Add GraphQL codegen for type-safe Apollo hooks (replace `<any>` casts) | — |
| T-3 | 🟢 | Unify enum casing: frontend lowercase ↔ backend UPPERCASE mapping is fragile | — |
| T-4 | 🟢 | Add error boundaries and proper GraphQL error handling in UI | — |
| T-5 | 🟢 | Containment rules: seed data not migrated to Postgres yet | — |
| T-6 | 🟢 | Group types: seed data not migrated to Postgres yet | — |
| T-7 | 🔴 | Backend authorization audit: all mutations hidden from players on frontend must also enforce GM-only on backend (prevent GraphQL injection). Verify every mutation checks role before executing. | — |
| T-8 | 🟡 | Input sanitization audit: verify all user-submitted fields (rich text, names, descriptions) are sanitized against XSS/HTML injection before storage and rendering. Prisma parameterizes SQL, but stored HTML rendered via `dangerouslySetInnerHTML` (RichContent/TipTap) needs sanitization layer. | — |

---

## Completed (recent)

| # | Description | Version |
|---|---|---|
| ✅ | Backend scaffolded: Apollo Server + Prisma + Postgres + Docker | — |
| ✅ | All 11 query files migrated from TanStack Query to Apollo Client | — |
| ✅ | Login flow updated for GraphQL backend | — |
| ✅ | Agent team configured: architect, frontend-dev, backend-dev | — |
| ✅ | File upload system: REST endpoint, local storage by campaign (`uploads/campaign/{id}/{entity}/{uuid}.ext`), static serving | — |
| ✅ | Fix: client-side ID generation removed from all drawers (NPC, Quest, Session, Location, Character, Relation) | — |
| ✅ | Fix: group membership add/remove now uses dedicated mutations (not saveNpc) | — |
| ✅ | Fix: location presence add/remove/note uses dedicated mutations on both NPC and Location pages | — |
| ✅ | Fix: social relations refetch both entity and campaign queries, `__typename` excluded from input | — |
| ✅ | Fix: `saveNPC`/`saveLocation`/`saveCharacter` resolvers no longer overwrite `image` when not provided | — |
| ✅ | Fix: `express.json` limit raised to 10MB, `image` removed from GraphQL save inputs (managed via REST upload) | — |
| ✅ | Fix: frozen Apollo cache arrays copied before `.sort()` | — |
| ✅ | NPC page: group membership management (add/remove) | — |
| ✅ | NPC list: avatar photos in list + card layout in preview panel | — |
| ✅ | Location detail: image/map moved to right column, markers on mini-map preview, delete button | — |
| ✅ | Location list: description rendered via RichContent instead of plain text | — |
| ✅ | Image upload: cache-busting after replace, removed image upload from LocationEditDrawer | — |
| ✅ | EmptyState component used consistently on all list pages (NPC, Session, Quest, LocationTypes) | — |
| ✅ | Shared ImageUpload component used for location map (consistent View/Replace hover UI) | — |
| ✅ | Quests CRUD, social relations editing, BG3-style bars | 0.2.3 |
| ✅ | Dashboard overhaul, campaign list, session badges | 0.2.2 |
| ✅ | Sessions, LocationIcon, unified UI patterns | 0.2.1 |
