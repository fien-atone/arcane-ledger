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
| F-6 | 🟢 | AI: NPC generation — имя, внешность, предыстория на основе контекста кампании | — |
| F-7 | 🟢 | AI: парсинг заметок сессии в сущности — NPC, локации, квесты из свободного текста | — |
| F-13 | 🟢 | AI: генерация локаций и городов на основе типа, климата и региона | — |
| F-14 | 🟢 | AI provider: поддержка self-hosted Ollama (Qwen/Llama) как альтернатива облачным API — для офлайн и приватности | — |
| F-8 | 🟢 | Export: PDF character sheets, session summaries | — |
| F-9 | 🟢 | Dice roller: persist roll history per session | — |
| F-10 | 🟢 | OAuth login (Google/Discord) | — |
| F-11 | 🟡 | All search/filter must go through server (debounced GraphQL queries, no client-side filtering). **Do this AFTER frontend section-widgets refactor finishes** — every list page will have a uniform `useXxxListPage` hook by then, so a single pass can convert all of them to server-side search with `keepPreviousData`/`cache-and-network` to prevent the loading flicker that originally pushed us toward client-side filtering. Currently client-side: GroupTypesPage. | — |
| F-15 | 🟡 | Timelines: visual timeline view for campaign events, session history, NPC encounters, quest progression | — |
| F-17 | 🟢 | Social GM groups — a group of GMs can see each other's campaigns, coordinate session schedules across multiple games, shared calendar view. For communities running multiple parallel campaigns | — |
| F-18 | 🟡 | Rate limiting on login mutation — protect against brute-force password attacks. Use express-rate-limit or graphql-rate-limit. Reasonable limits: 5 attempts per email per 15 minutes | — |
| F-19 | 🟡 | Audit log for all mutations — record who/what/when for every create/update/delete across all entities (not just admin). Enables: forensics, undo of accidental deletes, "recently changed" view, accountability in shared GM groups. Store as separate AuditLog table with entity type, entity id, action, user id, timestamp, and JSON snapshot of the change | — |
| F-20 | 🟢 | Password requirements: minimum 8 characters, mix of letters and numbers. Currently only enforced as 4 characters in self-service password change | — |
| F-21 | 🟢 | Email format validation on backend (currently any string accepted as email). Use Zod or simple regex check before user creation/update | — |

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
| T-8 | 🟡 | Input validation: add Zod schemas for all GraphQL mutations (max length, format checks, enum validation) — currently only requireNonEmpty exists for one field | — |
| T-9 | 🟡 | GraphQL Code Generator: replace all 27 `useQuery<any>` with generated types from schema | — |
| T-10 | 🟡 | Refactor LocationDetailPage (1623 lines) into 5+ section components | — |

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
| ✅ | GraphQL subscriptions: real-time updates when data changes | 0.3.0 |
| ✅ | Role-based field visibility: hide GM Notes from players | 0.3.0 |
| ✅ | Campaign invitations: invite users to campaign as player | 0.3.0 |
| ✅ | i18n: English and Russian language support | 0.3.0 |
| ✅ | Responsive UI card panels across all pages | 0.3.0 |
| ✅ | Backend authorization audit (T-7): GM role checks on all mutations + 61 tests | 0.3.1 |
| ✅ | XSS sanitization (T-8): DOMPurify on all dangerouslySetInnerHTML | 0.3.1 |
| ✅ | Hardcoded secrets removed from docker-compose, .env support | 0.3.1 |
| ✅ | JWT_SECRET required at startup (no insecure fallback) | 0.3.1 |
| ✅ | CORS restricted to known frontend origins | 0.3.1 |
| ✅ | N+1 query fixes: invitations, location children (DataLoader) | 0.3.1 |
| ✅ | Global GraphQL error toast notifications | 0.3.1 |
| ✅ | Global loading indicator (top-center pill) | 0.3.1 |
| ✅ | Friendly NotFoundState component for missing entities | 0.3.1 |
| ✅ | Backend test infrastructure: 146 tests (security + functional) | 0.3.1 |
| ✅ | Frontend E2E test infrastructure: 11 Playwright tests | 0.3.1 |
| ✅ | Test database isolation: refuses to run against production DB | 0.3.1 |
| ✅ | Admin endpoint security: 15 tests covering privilege escalation, SQL injection | 0.3.1 |
| ✅ | Visibility controls gated on Party module (F-16) | 0.3.1 |
| ✅ | Visibility toggles on session detail page for linked entities | 0.3.1 |
| ✅ | Quests CRUD, social relations editing, BG3-style bars | 0.2.3 |
| ✅ | Dashboard overhaul, campaign list, session badges | 0.2.2 |
| ✅ | Sessions, LocationIcon, unified UI patterns | 0.2.1 |
