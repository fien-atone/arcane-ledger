# Test Coverage — Arcane Ledger

**Last updated**: 2026-04-10
**Total**: 169 backend + 367 frontend Vitest + 11 frontend E2E = **547 tests**

This document explains what each test verifies in plain language. Use it to:
- Understand what's protected by automated tests
- See what the test names actually check (without reading code)
- Find gaps in test coverage when planning new features

## How to run

```bash
# Backend tests (auto-uses arcane_ledger_test database)
cd backend && npm test                      # one-shot
cd backend && npm run test:watch            # watch mode
cd backend && npm run test:setup-db         # create + seed test DB if missing

# Frontend Vitest (component + hook tests)
cd frontend && npm test                     # one-shot
cd frontend && npm test -- --watch          # watch mode
cd frontend && npm test -- <filter>         # run tests matching a pattern

# Frontend E2E tests (requires running app + backend)
cd frontend && npm run test:e2e             # headless
cd frontend && npm run test:e2e:ui          # interactive
```

---

## Test tiers

| Tier | Runner | Scope | Count |
|---|---|---|---|
| Backend functional + security | Vitest + supertest + real PostgreSQL (`arcane_ledger_test`) | Resolvers, auth, visibility, mutation authorization, rate limiting, N+1 regression, GraphQL schema behavior | 169 |
| Frontend component + hook | Vitest + `@testing-library/react` + `@apollo/client/testing` MockedProvider + jsdom | Section widgets, page-level hooks, shared primitives (SectionPanel, InlineConfirm, FormDrawer, useLinkedEntityList, useDebouncedSearch), colocated next to the code they cover | 367 |
| Frontend E2E | Playwright (Chromium only) | Full user flows: login, i18n switching, role-based visibility, XSS sanitization | 11 |

Frontend component tests are colocated: `NpcHeroSection.tsx` has `NpcHeroSection.test.tsx` next to it. Test infrastructure (`renderWithProviders`, `renderHookWithProviders`) lives in `frontend/src/test/helpers.tsx`.

---

## Backend tests (169)

Tests live in `backend/src/__tests__/`. They run against a real PostgreSQL database (`arcane_ledger_test`), seeded with the same data as production. Each test creates its own data and cleans up after itself.

The test runner refuses to run against any database that doesn't have `_test` in its URL — production cannot be accidentally polluted.

### Security tests

#### `security/jwt.test.ts` — JWT Authentication (6 tests)

- Authenticated requests with a valid token receive their user in context
- Requests without a token result in `context.user === null` (not an error)
- Expired tokens are rejected
- Malformed tokens are rejected
- Tokens signed with a different secret are rejected
- Tokens referencing a deleted/non-existent user are rejected

#### `security/cors.test.ts` — CORS Restrictions (5 tests)

- Preflight requests from unknown origins (e.g. `https://evil.com`) do NOT receive permissive CORS headers
- Preflight requests from `http://localhost:5173` (Vite dev) get the correct allow-origin header
- Preflight requests from `http://localhost:3000` (alternate dev) also work
- Actual POST requests from allowed origins succeed
- POST requests from unknown origins do not get reflected CORS headers

#### `security/mutation-auth.test.ts` — GM Authorization on Mutations (61 tests)

For each protected mutation, three checks:
- Unauthenticated requests are rejected with `UNAUTHENTICATED`
- Player-role users (campaign members without GM permission) are rejected with `FORBIDDEN`
- GM-role users are allowed to perform the operation

Mutations covered:
- `saveNPC` (create + update), `deleteNPC`
- `saveLocation` (create + update), `deleteLocation`
- `saveSession` (create + update), `deleteSession`
- `saveQuest` (create + update), `deleteQuest`
- `saveGroup` (create + update), `deleteGroup`
- `saveCharacter` (create + update), `deleteCharacter`
- `saveRelation`, `deleteRelation`
- `updateCampaign`

Special cases:
- `saveSessionNote` is allowed for any campaign member (GM and Player), since each user writes their own private notes

#### `security/admin-auth.test.ts` — Admin Endpoint Security (15 tests)

The most critical surface — admin endpoints can create or modify any user account.

**`adminUsers` query** (list all users):
- Unauthenticated requests rejected
- Regular USER (non-admin) rejected with FORBIDDEN
- ADMIN can list users
- Search parameter is parameterized — SQL-injection-style payloads (`' OR 1=1 --`) return zero results, not all users

**`adminCreateUser` mutation**:
- Unauthenticated requests rejected; verified the user wasn't sneakily created
- Regular USER rejected with FORBIDDEN
- **Privilege escalation blocked**: regular USER cannot create an account with `role: ADMIN`
- ADMIN can create users normally

**`adminUpdateUser` mutation**:
- Unauthenticated requests rejected
- Regular USER cannot modify another user's name/email
- **Privilege escalation blocked**: regular USER cannot elevate another user to ADMIN
- **Self-elevation blocked**: regular USER cannot promote themselves to ADMIN
- All attacks verified by checking the database state did not change

**`adminDeleteUser` mutation**:
- Unauthenticated requests rejected; user still exists after attempt
- Regular USER cannot delete another user
- Regular USER cannot delete the admin account (denial-of-service prevention)

### Functional tests (52 tests)

#### `functional/campaigns.test.ts` — Campaign lifecycle (6 tests)
- Creating a campaign automatically makes the creator a GM
- Listing campaigns returns user's campaigns with their role
- Updating title and description works
- Archiving sets `archivedAt` timestamp
- Restoring clears `archivedAt`
- Toggling enabled sections persists across reads

#### `functional/npcs.test.ts` — NPC lifecycle (10 tests)
- Empty NPC name is rejected with `BAD_USER_INPUT`
- Whitespace-only NPC name is rejected
- Creating an NPC generates a server-side UUID
- Listing NPCs for a campaign returns the created one
- Updating NPC fields persists changes
- Adding NPC presence at a location creates the junction record with optional note
- Removing NPC presence cleans up the junction record
- Adding NPC group membership with role/subfaction works
- Removing NPC group membership works
- Deleting an NPC removes it from list

#### `functional/locations.test.ts` — Locations + types (6 tests)
- Creating a location generates a UUID
- Listing locations for a campaign
- Updating location fields persists
- Creating a child location with `parentLocationId` establishes the parent-child relationship
- Location type CRUD (create, assign to location, delete unassigned type)
- Deleting a location

#### `functional/sessions.test.ts` — Sessions + per-user notes (7 tests)
- Creating a session auto-increments the session number
- Sessions are listed in descending order by number
- Updating fields (title, datetime, brief) persists
- Linking NPCs / Locations / Quests via junction tables
- GM can save a session note (their own private text)
- Player can save their own session note (separate from GM's — both coexist)
- Deleting a session cascades

#### `functional/quests.test.ts` — Quest lifecycle (4 tests)
- Creating a quest with status
- Status lifecycle transitions: ACTIVE → COMPLETED → FAILED
- Setting quest giver via NPC link
- Deleting a quest

#### `functional/groups.test.ts` — Groups + types (4 tests)
- Creating a group
- Updating group fields
- Group type CRUD (create, update, delete)
- Deleting a group

#### `functional/party.test.ts` — Player characters + invitations (6 tests)
- Creating a player character generates a UUID
- Updating character fields
- Assigning a character to a player (links via `userId`)
- Deleting a character
- Inviting a player by email creates an invitation record
- Accepting an invitation creates a campaign membership and removes the invitation

#### `functional/visibility.test.ts` — Field-level visibility for players (8 tests)
- Hidden NPC is invisible to player (returns null on direct query)
- Setting NPC visibility with field-level control redacts fields not in the visible list
- Hiding an NPC again restores invisibility
- Setting Location visibility with field-level redaction
- Setting Quest visibility with field-level redaction
- Setting Group visibility with field-level redaction
- Player query for list returns only visible entities (filtered)
- GM query returns all entities regardless of visibility (GM bypass)

#### `functional/relations.test.ts` — NPC social relations (4 tests)
- Creating a directed relation between two NPCs
- Updating friendliness scale and note
- Querying relations returns both incoming and outgoing edges for an NPC
- Deleting a relation cleans up both sides

---

## Frontend E2E tests (11)

Tests live in `frontend/e2e/`. Run with Playwright + Chromium. Require the backend (`localhost:4000`) and Vite dev server (`localhost:5173`) to be running.

### `e2e/auth.spec.ts` — Authentication flow (3 tests)
- Logging in with valid GM credentials redirects to the campaigns page
- Logging in with invalid credentials shows an error message
- Visiting a protected route while logged out redirects to the login page

### `e2e/xss.spec.ts` — XSS prevention (2 tests)
- Rich-text content in the database does not result in any `<script>` tags in the rendered DOM
- Injecting `<img onerror="window.__xss = true">` does not set the sentinel — DOMPurify strips the handler

### `e2e/role-visibility.spec.ts` — GM-only UI (3 tests)
- GM sees the "Create Campaign" button on the campaigns page
- GM sees all sidebar navigation sections inside a campaign
- Campaign dashboard renders for GM (sanity check)

### `e2e/i18n.spec.ts` — Language switching (3 tests)
- Landing page at `/en` renders English content
- Clicking the language toggle switches to `/ru` and renders Russian content
- Direct navigation to `/ru` renders Russian without a redirect

---

## What's NOT covered yet

These are intentional gaps — areas where automated tests would help but haven't been written:

- **Player-side functional tests**: Most tests use a GM. Player-perspective views (visibility, restricted UI) are only covered by mutation-auth and visibility.test.ts.
- **Subscription delivery**: No test verifies that WebSocket subscriptions actually fire when data changes.
- **File upload endpoint**: No test for the REST upload endpoint.
- **Concurrent edits**: No test for race conditions when two GMs edit the same entity simultaneously.
- **Payment/subscription**: N/A — the app has no paid features yet.
- **Frontend unit tests**: Components are tested only through E2E. No Vitest unit tests on the frontend.
- **Visual regression**: No screenshot comparison tests.
- **Backend N+1 detection**: We fixed N+1 in invitations and Location.children, but there's no test that automatically catches new N+1 issues.

---

## Adding new tests

When adding a new feature, ask:

1. **Auth**: Does this need a GM check? Add to `mutation-auth.test.ts`.
2. **CRUD**: Does it create/update/delete an entity? Add to `functional/<domain>.test.ts`.
3. **Visibility**: Does it expose new fields? Add to `functional/visibility.test.ts`.
4. **User-facing**: Is it a critical user flow? Add to `e2e/<domain>.spec.ts`.

Test files use the helpers in `backend/src/__tests__/helpers.ts`:
- `getTestApp()` — boots Apollo on a random port
- `loginAs(request, email, password)` — returns JWT token
- `graphql(request, query, variables, token)` — sends a GraphQL request
- `hasErrorCode(res, 'FORBIDDEN')` / `hasAuthError(res)` — assertion helpers

Constants for seeded users:
- `GM_EMAIL = 'gm@arcaneledger.app'` (system role: ADMIN, campaign role: GM)
- `PLAYER_EMAIL = 'ivan@arcaneledger.app'` (system role: USER, campaign role: PLAYER)
- `CAMPAIGN_ID = 'campaign-farchester'`
