# Arcane Ledger — Backlog

Task tracker for bugs, features, and improvements. Managed by the team lead.

Legend: `🔴` critical · `🟡` important · `🟢` nice to have · `✅` done · `🚧` in progress · `❌` rejected · `⏭` deferred (will reconsider later)

---

## In Progress

_Nothing currently in progress._

---

## Bugs

| # | Priority | Description | Assigned |
|---|---|---|---|
| B-1 | 🟢 | Campaign create uses client-side ID fallback if server response is slow. **Status: needs verification** — a broader "client-side ID generation removed from all drawers" fix was landed earlier (see Completed), confirm this specific path is actually still broken before working on it. | — |
| B-3 | 🟢 | Social relations: `char-alvin` link on NPC pages may not resolve name if party data hasn't loaded. **Note:** `char-alvin` was a mock-data ID that no longer exists in the seed. Rewrite as a general "relation links may render stale when the referenced entity is still loading" if you can still reproduce it, otherwise close. | — |

---

## Features

| # | Priority | Description | Assigned |
|---|---|---|---|
| F-1 | 🟡 | End-to-end testing: verify all pages work with GraphQL backend (not just build). **Partial:** 4 Playwright specs exist (auth, i18n, role-visibility, xss). Missing: happy-path coverage for every CRUD flow (NPC/Location/Session/Quest/Group/Character create+edit+delete, party management, visibility toggle, admin user management, campaign invitation). Estimated ~15 new specs. | — |
| F-2 | ❌ | Seed script: migrate mock data (NPCs, locations, sessions, quests, groups) into Postgres. **Rejected** — the backend `seed.ts` already contains a full 1675-line seed (Drakkenheim campaign) that covers all entity types. This ticket was written before that seed existed. Closing. | — |
| F-18 | 🟡 | Rate limiting on login mutation — protect against brute-force password attacks. Use express-rate-limit or graphql-rate-limit. Reasonable limits: 5 attempts per email per 15 minutes. | — |
| F-23 | 🟡 | Campaign create: module picker in drawer. When creating a new campaign, show a "Modules" section in the drawer with two visually separated groups — "Recommended" (the basics most GMs need: npcs, locations, sessions, quests, groups) and "Optional" (party, species, species_types, group_types, location_types, social_graph). User ticks what they want, those become `enabledSections` on the new campaign. Current behavior: all sections enabled by default. Depends on: nothing. | — |
| F-24 | 🟡 | Type pages: "Fill from template" empty-state CTA. When GroupTypes / LocationTypes / SpeciesTypes pages are empty, show two buttons in the empty state: "Create first type" (existing behavior) and "Fill from template" (new — opens a picker with available presets). Presets stored as JSON files in `backend/src/presets/` (fantasy_en, fantasy_ru, etc.), loaded via a new mutation `applyTypePreset(campaignId, presetSlug, kind)`. Default preset language picked from current i18n. Empty preset option stays as the "do nothing" path. Depends on: preset JSON files existing (F-25). | — |
| F-25 | 🟡 | Generic-fantasy type presets (EN + RU). Create `backend/src/presets/fantasy_en.json` and `fantasy_ru.json` with locationTypes (~20, with icons and categories), groupTypes (~15), speciesTypes (~15), and basic containment rules for LocationTypes (City→District, Region→City, Continent→Region). Content is system-agnostic (works for D&D 5e, Pathfinder, generic fantasy) and uses only SRD-safe names. D&D-specific presets deferred until there's a `Campaign.system` concept. Depends on: nothing. Consumed by F-24. | — |
| F-19 | 🟡 | Audit log for all mutations — record who/what/when for every create/update/delete across all entities (not just admin). Enables: forensics, undo of accidental deletes, "recently changed" view, accountability in shared GM groups. Store as separate AuditLog table with entity type, entity id, action, user id, timestamp, and JSON snapshot of the change. | — |
| F-22 | 🟡 | Restore filter chip counts after F-11. Server-side search returns only filtered rows, so per-status/per-type counts (e.g. "Alive (12)") were dropped across NPCs, Locations, Quests, Groups, Species list pages. Fix: add lightweight aggregation queries like `npcCountsByStatus(campaignId)` / `locationCountsByType(campaignId)` etc. (Prisma `groupBy`), fetch them independently of the filter, wire into `useXxxListPage` as a second hook. Also restores the "X of Y" counter in hero sections. | — |
| F-15 | 🟡 | Timelines: visual timeline view for campaign events, session history, NPC encounters, quest progression. | — |
| F-20 | 🟢 | Password requirements: minimum 8 characters, mix of letters and numbers. Currently only enforced as 4 characters in self-service password change. | — |
| F-21 | 🟢 | Email format validation on backend (currently any string accepted as email). Use Zod or simple regex check before user creation/update. Partial overlap with T-8 (Zod schemas for mutations). | — |
| F-8 | 🟢 | Export: PDF character sheets, session summaries. | — |
| F-9 | 🟢 | Dice roller: persist roll history per session. | — |
| F-10 | 🟢 | OAuth login (Google/Discord). | — |
| F-17 | 🟢 | Social GM groups — a group of GMs can see each other's campaigns, coordinate session schedules across multiple games, shared calendar view. For communities running multiple parallel campaigns. | — |
| F-6 | ⏭ | AI: NPC generation — name, appearance, backstory based on campaign context. Deferred — AI features are a whole subsystem (provider, prompt engineering, quota, cost). Group F-6/F-7/F-13/F-14 into one initiative before picking anything from it. | — |
| F-7 | ⏭ | AI: parse session notes into entities — NPCs, locations, quests from free text. Part of AI initiative. | — |
| F-13 | ⏭ | AI: generate locations and cities based on type, climate, region. Part of AI initiative. | — |
| F-14 | ⏭ | AI provider: self-hosted Ollama (Qwen/Llama) support as alternative to cloud APIs — for offline and privacy. Part of AI initiative. | — |

---

## Tech Debt

| # | Priority | Description | Assigned |
|---|---|---|---|
| T-9 | 🟡 | GraphQL Code Generator: replace all `useQuery<any>` with generated types from schema. **Status:** 14 `useQuery<any>` remain (was 27 in the original ticket — half reduced by Phase 2 / F-11 rewrites). Still worth doing for type safety. | — |
| T-8 | 🟡 | Input validation: add Zod schemas for all GraphQL mutations (max length, format checks, enum validation) — currently only `requireNonEmpty` exists for one field per resolver. Overlaps with F-21 (email validation), can be done together. | — |
| T-3 | 🟢 | Unify enum casing: frontend lowercase ↔ backend UPPERCASE mapping is fragile. 15+ `.toLowerCase()`/`.toUpperCase()` calls in query hooks. Fix: pick one casing, convert at the boundary in the backend resolver only. | — |
| T-4 | 🟢 | Add error boundaries in UI — currently there's no React `ErrorBoundary` anywhere. A rendering error in one section takes down the whole page. Add a top-level boundary at each route + per-section boundaries for isolated failures. GraphQL error handling itself is already covered by the global toast. | — |
| T-1 | ⏭ | Remove mock repositories and `mockData` after full backend migration. **Status:** still present (`frontend/src/shared/api/repositories/` + `mockData/`), still referenced by 3 detail hooks (NpcDetail, LocationDetail, CharacterDetail) via `VITE_USE_MOCK` fallbacks. Low urgency — mock mode works as an offline demo. Remove only when confident no one relies on it. | — |
| T-5 | ❌ | Containment rules: seed data not migrated to Postgres yet. **Rejected** — `seed.ts` creates 20+ containment rules via `containmentRules` array at line 232. Closing. | — |
| T-6 | ❌ | Group types: seed data not migrated to Postgres yet. **Rejected** — `seed.ts` creates all group types (seed.ts:183). Closing. | — |
| T-10 | ❌ | Refactor LocationDetailPage (1623 lines) into 5+ section components. **Rejected** — already done in Tier 1 (LocationDetailPage is now 162 lines). Closing. | — |

---

## Completed (recent)

| # | Description | Version |
|---|---|---|
| ✅ | F-11: Server-side search/filter across 9 list pages (NPCs, Locations, Sessions, Quests, Groups, Species, GroupTypes, LocationTypes, SpeciesTypes) with debounced input and Apollo v4 previousData keep-alive to prevent flicker. Admin Users aligned on shared useDebouncedSearch. Original GroupTypes flicker regression closed. See F-22 for chip-count restoration follow-up. | — |
| ✅ | Phase 2 redundancy audit: SectionPanel, InlineConfirm, form constants, FormDrawer (compound), useLinkedEntityList extracted and migrated across 112 files. −433 LoC, +48 tests. | — |
| ✅ | Frontend section widgets refactor: 22 pages decomposed into thin orchestrators + section widgets (Tier 1–3). 9898 → 2314 LoC in pages (−77%), +176 colocated tests. | — |
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
