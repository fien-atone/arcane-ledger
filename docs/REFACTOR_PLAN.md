# Frontend Refactor Plan — Section Widgets Architecture

**Status**: Pilot in progress  
**Last updated**: 2026-04-07  
**Decision**: Approved by user

This document is the source of truth for the frontend refactor effort. If you're picking up this plan in a new session, **read this file first**.

---

## Why we're doing this

The current frontend has a recurring problem: page files grow without bound. `LocationDetailPage` is 1623 lines. `NpcDetailPage` is 895. Every new feature in a domain adds code to the same page file. The pages do too much:

1. Fetch data
2. Render JSX
3. Handle business logic
4. Manage 30+ pieces of local state
5. Compose all sub-sections of the page

This isn't a problem of "individual files being too big". It's a structural problem — the architecture allows files to grow linearly with feature count, with no pressure to break them up.

## The new architecture: Section Widgets

Three structural changes:

### 1. Pages become thin orchestrators

A page file does only three things:
- Read route params
- Load the root entity (one query)
- Compose section widgets

Maximum 80-150 lines, even for the most complex pages.

```tsx
// pages/LocationDetailPage.tsx (target: ~80 lines)
export default function LocationDetailPage() {
  const { locationId } = useParams();
  const { data: location, isLoading } = useLocation(locationId);
  if (isLoading) return <LoadingState />;
  if (!location) return <NotFoundState />;

  return (
    <PageLayout>
      <LocationHeaderSection location={location} />
      <LocationMapSection locationId={location.id} />
      <LocationChildrenSection parentId={location.id} />
      <LocationNpcsSection locationId={location.id} />
      <LocationSessionsSection locationId={location.id} />
      <LocationVisibilitySection location={location} />
    </PageLayout>
  );
}
```

### 2. Section widgets are first-class units

Each "section" of a page is its own component with its own data, state, mutations, and JSX. Lives in `features/<domain>/sections/`.

```
features/locations/
  api/queries.ts          (Apollo hooks — as today)
  hooks/                  (NEW — custom hooks for page-level logic)
    useLocationDetail.ts
  sections/               (NEW — section widgets)
    LocationHeaderSection.tsx       (~150 lines)
    LocationMapSection.tsx          (~250 lines)
    LocationChildrenSection.tsx     (~120 lines)
    LocationNpcsSection.tsx         (~180 lines)
    LocationSessionsSection.tsx     (~100 lines)
    LocationVisibilitySection.tsx   (~80 lines)
  ui/                     (drawers, edit forms — as today)
    LocationEditDrawer.tsx
```

### 3. Custom hooks for cross-section logic

When state or handlers are shared across sections (or are page-level concerns), they go into a custom hook.

```ts
// features/locations/hooks/useLocationDetail.ts
export function useLocationDetail(locationId: string) {
  const { data: location, isLoading, isError } = useLocation(locationId);
  const isGm = useCampaignRole() === 'gm';
  const partyEnabled = useSectionEnabled('party');
  const deleteLocation = useDeleteLocation();
  const navigate = useNavigate();

  const handleDelete = useCallback(async () => {
    await deleteLocation.mutate(locationId);
    navigate('/locations');
  }, [...]);

  return { location, isLoading, isError, isGm, partyEnabled, handleDelete };
}
```

---

## Critical rules

### Rule 1: Section widgets fetch their own data

Section widgets **never** receive bulk data through props from the parent page. They fetch what they need themselves via specialized hooks.

```tsx
// ❌ BAD — parent has to know what every section needs
<LocationMapSection markers={location.mapMarkers} npcs={npcs} onUpdate={...} />

// ✅ GOOD — section is self-contained
<LocationMapSection locationId={location.id} />
```

This is what keeps pages thin. The moment a parent starts threading data through props, the page becomes a coordinator again, and the file grows.

### Rule 2: New page files cap at 200 lines

If a `pages/*.tsx` file approaches 200 lines, **stop**. Extract sections.

### Rule 3: One section = one concern

`LocationMapSection` deals with the map. It does NOT deal with the NPC list, session timeline, or visibility. Those are separate sections.

### Rule 4: Domain widgets vs. UI widgets

There are two kinds of widgets in the codebase, do not confuse them:

- **UI widgets** (`shared/ui/`) — generic, reusable, props-only. `Select`, `DatePicker`, `Modal`. Don't know about data.
- **Domain widgets / section widgets** (`features/<domain>/sections/`) — domain-specific, smart, fetch their own data, NOT reused. `LocationMapSection`, `NpcRelationsSection`.

---

## Reusable abstractions to extract

These will reduce ~800 lines of boilerplate across the codebase. Extract them as we go, not upfront:

| Abstraction | Lives in | Purpose |
|---|---|---|
| `<FormDrawer<T>>` | `shared/ui/` | Replaces 11 EditDrawer components with field config + onSave |
| `<SectionPanel title count action>` | `shared/ui/` | The card-panel layout used in every section header |
| `<InlineConfirm onConfirm onCancel>` | `shared/ui/` | The Yes/No confirmation pattern used everywhere |
| `<EntityListItem>` | `shared/ui/` | Row card pattern for lists |

---

## Migration order (priority)

Sorted by pain/risk ratio. **Do not skip ahead** — the order matters because each page teaches us something for the next.

Pages are grouped into three families because they decompose differently:
- **Detail pages**: many sections per entity — apply NpcDetailPage pattern
- **List pages**: filter bar + list + optional preview — different decomposition
- **Top-level pages**: cross-domain orchestrators (campaigns, admin, profile)

### Tier 1 — Detail pages (established pattern from pilot)

| # | Page | Lines | Status | Notes |
|---|---|---|---|---|
| 1 | NpcDetailPage | 895 → 112 | ✅ done | Pilot. 10 sections + 1 hook + 25 tests. Test infra set up: Vitest + Testing Library + Apollo MockedProvider. Lessons: Apollo v4 MockedProvider drops `addTypename` prop; `MockedResponse` type lives at `MockLink.MockedResponse<any, any>`. |
| 2 | SessionDetailPage | 705 → 123 | ✅ done | 8 sections + 1 hook + 28 tests. |
| 3 | GroupDetailPage | 457 → 102 | ✅ done | 7 sections + 1 hook + 19 tests. |
| 4 | CharacterDetailPage | 433 → 121 | ✅ done | 6 sections + 1 hook + 15 tests. Preserved canViewAll (isGm || isOwner) logic. |
| 5 | QuestDetailPage | 325 → 108 | ✅ done | 7 sections + 1 hook + 20 tests. |
| 6 | LocationDetailPage | 1620 → 162 | ✅ done | 11 sections + 1 hook + 24 tests + map/ subfolder with MapViewer/MiniMapPreview/LocationPlaceholder moved verbatim. Post-merge fix: MapViewer now uses createPortal to document.body to escape main overflow. |

**Tier 1 totals: 6/6 pages, 4435 → 728 lines (84% reduction), 131 new tests.**

### Tier 2 — List pages (different pattern)

List pages decompose into: `hooks/useXxxList.ts` (data + filters state) + `sections/XxxFilterBar.tsx` + `sections/XxxList.tsx` + optional `sections/XxxPreview.tsx` for pages with a right-side preview panel.

| # | Page | Lines | Status | Notes |
|---|---|---|---|---|
| 7 | LocationTypesPage | 717 → 118 | ✅ done | 4 sections + 1 hook + 12 tests. Fixes: containment rule delete idempotency (backend), inline confirm on ×, auto-select created type. |
| 8 | PartyPage | 606 → 151 | ✅ done | 6 sections + 1 hook + 24 tests. List-page pattern: hook owns shared state, sections receive props. |
| 9 | LocationListPage | 313 → 111 | ✅ done | 2 sections + 1 hook + 15 tests. URL-backed search/type filters. |
| 10 | SpeciesTypesPage | 262 → 137 | ✅ done | 3 sections + drawer + 1 hook + 11 tests. Bonus: idempotent delete fix for all 3 type-delete mutations. |
| 11 | NpcListPage | 255 → 107 | ✅ done | 2 sections + 1 hook + 11 tests. URL-backed search/status filters. |
| 12 | GroupTypesPage | 253 → 137 | ✅ done | 3 sections + 1 hook + 12 tests. Switched to client-side search to fix list flicker (server-side will be done in F-11 sweep after refactor). |
| 13 | GroupListPage | 214 → 108 | ✅ done | 2 sections + 1 hook + 11 tests. Client-side search/type filter. |
| 14 | QuestListPage | 204 → 97 | ✅ done | 2 sections + 1 hook + 11 tests. Client-side search/status filter. |
| 15 | SessionListPage | 195 → 94 | ✅ done | 2 sections + 1 hook + 7 tests. Client-side search. |
| 16 | SpeciesPage | 187 → 102 | ✅ done | 2 sections + 1 hook + 11 tests. Client-side search/type filter. |

**Tier 2 totals: 10/10 pages, 3206 → 1162 lines (64% reduction), 125 new tests.**

### Tier 3 — Top-level pages (cross-domain, no single feature owner)

These don't live in a single `features/<domain>/`. Sections go into `widgets/<page-name>/` or a dedicated `pages/<page>/sections/` folder.

| # | Page | Lines | Status | Notes |
|---|---|---|---|---|
| 17 | CampaignDashboardPage | 588 → 124 | ✅ done | 6 widget sections + 1 hook + 6 tests. Inline title/description editing preserved. |
| 18 | CampaignsPage | 381 → 79 | ✅ done | 4 sections + 1 hook + 6 tests. Cross-campaign calendar separate from dashboard calendar. |
| 19 | LandingPage | 267 → 37 | ✅ done | 7 presentational sections under widgets/landing + 14 smoke tests. Post-merge fix: absolutely-centered nav links to avoid shift on language toggle. |
| 20 | AdminUsersPage | 262 → 58 | ✅ done | 2 sections + 1 hook + 8 tests. Debounced search, inline delete confirm. |
| 21 | ProfilePage | 261 → 44 | ✅ done | 4 sections + 10 tests (no shared hook — each form is independent). Fix: always use translated error messages. |
| 22 | SocialGraphPage | 498 → 82 | ✅ done | 2 sections + view wrapper + 1 hook + 7 tests. D3 primitives in features/social-graph/ui/ left untouched. |

**Tier 3 totals: 6/6 pages, 2257 → 424 lines (81% reduction), 51 new tests.**

### Not refactoring (too small, no benefit)

| Page | Lines | Why skipped |
|---|---|---|
| SpeciesDetailPage | 171 | Small, simple |
| LoginPage | 144 | Already thin |
| NpcDetailPage | 112 | ✅ done |
| ChangelogPage | 97 | Thin |

**Progress: 16/22 pages done (6 Tier 1 + 10 Tier 2). 6 Tier 3 remaining.**
**Frontend test count: 131 → 257 (+126 across all refactors).**

---

## Workflow per page

For each page in the order above:

1. **New feature branch**: `refactor/<page-name>` (e.g., `refactor/npc-detail-page`)
2. **Extract sections** into `features/<domain>/sections/`
3. **Extract hooks** into `features/<domain>/hooks/`
4. **Rewrite page file** as thin orchestrator (≤200 lines, ideally ≤150)
5. **Add component tests** for each new section (Vitest + Testing Library + Apollo MockProvider)
6. **Add hook tests** for each new custom hook
7. **Run all tests**: backend (`npm test` in backend) and frontend (`npm test` once Vitest is set up) and E2E if relevant
8. **Build check**: `npm run build` must pass cleanly
9. **User review**: User manually verifies the page works in the browser before merge
10. **Merge to develop**: `--no-ff` merge, push

**One page = one branch = one PR.** No batching.

---

## Phase 2: Redundancy audit — IN PROGRESS

Tier 1–3 decomposition finished 2026-04-08 (22/22 pages). Phase 2 extracts cross-feature abstractions *after* we can see the whole picture.

**Guiding principle (learned from `shared/ui/Select.tsx` near-miss and ProfilePage error-display regression):** purely presentational abstractions succeed (EmptyState, ImageUpload). Abstractions that know about domain data accumulate optional props until they rot. → Prefer **hooks over components** for data-aware extractions. Prefer **compound components** over config objects for UI with variants.

### Inventory (2026-04-08 audit)

| Pattern | Occurrences | Risk | Action |
|---|---|---|---|
| Card-panel wrapper (`bg-surface-container border ... rounded-sm p-6` + gold header) | 83 sections | Low (pure UI) | **Extract → `<SectionPanel>`** |
| Inline Yes/No confirm (`confirmRemove*` state + yes/no buttons) | 19 sections | Low (pure UI) | **Extract → `useInlineConfirm()` + `<InlineConfirm>`** |
| `LABEL_CLS` / `INPUT_CLS` / `toArray`/`fromArray` duplication | 15 files | Low | **Extract → `shared/ui/form.ts` constants** |
| EditDrawer boilerplate (overlay + form + save mutation) | 11 drawers, 1969 lines | Medium (data-aware) | **Extract compound `<FormDrawer>` — NOT config object** |
| Linked-entity list sections (picker + remove + visibility toggle) | 8 full + 5 read-only | **High (data-aware, already diverging)** | **Extract hook only (`useLinkedEntityList`). Keep JSX per-section.** Re-evaluate component after 3 migrations |
| `useXxxListPage` hooks (11 hooks, 1854 lines) | 11 | Medium | **Defer until after F-11** (server-side search sweep will rewrite half these hooks anyway) |
| `useXxxDetail` hooks (6 hooks, 620 lines) | 6 | Low gain, high generic-gymnastics cost | **Skip.** Hooks are lean, domains diverge enough |

### Step list

One abstraction = one branch = one PR. Run full build + tests before each merge. User verifies in browser before merge.

| # | Branch | Abstraction | Call sites to migrate | Status |
|---|---|---|---|---|
| 1 | `refactor/section-panel` | `<SectionPanel title action>` in `shared/ui/` | 83 sections | pending |
| 2 | `refactor/inline-confirm` | `useInlineConfirm()` hook + `<InlineConfirm>` in `shared/ui/` | 19 sections | pending |
| 3 | `refactor/form-constants` | `LABEL_CLS` / `INPUT_CLS` / `toArray` / `fromArray` in `shared/ui/form.ts` | 15 files | pending |
| 4 | `refactor/form-drawer` | Compound `<FormDrawer>` + `<FormDrawer.Field>` in `shared/ui/` | 11 drawers | pending |
| 5 | `refactor/linked-entity-hook` | `useLinkedEntityList()` hook (JSX stays per-section) | 8 linked sections | pending |
| 6 | (deferred) | `useEntityListPage<T>` | 11 list hooks | blocked by F-11 |
| ~~7~~ | — | ~~`useEntityDetail<T>` generic~~ | — | dropped (low gain) |

### Hard rules for Phase 2

1. **Rule of three minimum.** No abstraction with fewer than 3 real call sites.
2. **200-line limit per abstraction.** If it grows past that, it's solving the wrong problem — revert and reconsider.
3. **Compound components over config objects** for any abstraction with 2+ variants.
4. **Hooks over components** when the thing knows about domain data. Component-level generalisation is the higher-risk tier.
5. **If last 20% of call sites need 5+ optional flags to fit**, exclude them. Leave them as bespoke sections.
6. **One branch = one PR = user verifies before merge.** Same workflow as Tier 1–3.
7. **Snapshot tests for SectionPanel and FormDrawer** — protect against "one className typo breaks 83 files" regressions.

### Success criteria

- Total frontend LoC decreases by ≥15% from current baseline (post-Tier-3)
- Test count stays the same or grows
- No visual regression
- No user-reported behavior change

### How to verify each step (human language)

App URL: **http://localhost:5173** — login as `gm@arcaneledger.app` / `user`. Pick any campaign you have with seed data.

Each step is a visual or interaction test. If the thing looks the same and still works — it passes. No "unit tests", just poke the app.

**Step 1 — SectionPanel**
- Open an NPC detail page. Look at the section headers ("Identity", "Appearance", "Relations" etc.) — gold uppercase title, thin divider line, card background.
- Same check on a Session detail page and a Location detail page.
- Check: the gold headers look identical to before. Nothing shifted, nothing misaligned.

**Step 2 — InlineConfirm**
- Open an NPC detail page → Groups section → click the × next to any group.
- Check: inline "Remove?" with Yes/No appears (no browser popup). Click No → it disappears. Click × again → click Yes → the group is removed.
- Same check on: Session detail → remove linked NPC, Location detail → remove linked NPC, Character detail → remove group membership.

**Step 3 — Form constants**
- Open any Edit drawer (NPC, Location, Session…). Type into a text field.
- Check: labels, inputs, spacing look identical to before. Text is readable.
- Nothing else to test — this step only moves shared strings.

**Step 4 — FormDrawer**
- This one touches 11 drawers, so allocate 10 min for a thorough pass:
  - **NPC**: create new NPC → fill name, save → appears in list. Open existing NPC → edit → save → changes stick.
  - **Location**: same — create + edit.
  - **Session**: same — create + edit (check date picker still works).
  - **Group / Character / Quest / Species / GroupType / SpeciesType**: create + edit one of each.
  - **Admin → Users**: create a user, edit its email, delete confirmation still shows.
  - **Campaigns page**: "New Campaign" drawer opens, can create a campaign.
- Check for each: drawer opens from the right, closes on backdrop click, Cancel button works, Save button works, form fields retain values.

**Step 5 — LinkedEntityList hook**
- On an NPC detail page:
  - Groups section: add a group → it appears. Remove it → it's gone.
  - Locations section: same (add/remove).
  - Relations section: same.
- On a Session detail page:
  - NPCs / Locations / Quests sections: same add/remove flow for each.
- On a Group detail page: members add/remove.
- Key thing to check: if you're a GM and Party module is on → the "visibility" toggle (eye icon) still works on each linked item. Click it, refresh, check state persisted.

**If anything looks wrong** — report exactly which page + which section + what happened. I'll fix before merge.

### Do NOT start this phase until:

- ~~All pages in the priority list are decomposed~~ ✅ done 2026-04-08
- ~~All section widgets have tests~~ ✅ 307 frontend tests
- ~~User has verified the decomposed pages work correctly in the browser~~ ✅ all 22 pages verified during Tier 1–3

---

## Frontend test infrastructure (set up with the pilot)

Currently the frontend only has Playwright E2E tests (11 tests). We need a faster, finer-grained tier.

### Stack to add

| Tool | Purpose |
|---|---|
| `vitest` | Test runner (already installed for backend, just add frontend config) |
| `@testing-library/react` | Component testing |
| `@testing-library/jest-dom` | DOM matchers |
| `@apollo/client/testing` | Apollo MockProvider for stubbed queries/mutations |
| `jsdom` | DOM environment for tests |

### Test types

**Unit tests for hooks** (fastest, most useful):
```ts
test('useLocationDetail returns location and isGm flag', async () => {
  const { result } = renderHook(
    () => useLocationDetail('loc-1'),
    { wrapper: MockProvider }
  );
  await waitFor(() => expect(result.current.location).toBeDefined());
  expect(result.current.isGm).toBe(true);
});
```

**Component tests for sections**:
```ts
test('LocationMapSection shows markers', () => {
  render(<LocationMapSection locationId="loc-1" />, { wrapper: MockProvider });
  expect(screen.getByText('Marker 1')).toBeInTheDocument();
});
```

**E2E tests** (Playwright, already exists): keep adding one critical user-flow test per refactored page.

### File structure

```
frontend/src/
  features/locations/
    sections/
      LocationMapSection.tsx
      LocationMapSection.test.tsx     ← component test
    hooks/
      useLocationDetail.ts
      useLocationDetail.test.ts       ← hook test
```

Tests live next to the code they test (colocated). Pattern: `*.test.ts` / `*.test.tsx`.

---

## Pilot: NpcDetailPage decomposition target

When we start the pilot, this is the decomposition we're aiming for:

```
features/npcs/
  hooks/
    useNpcDetail.ts                   (~60 lines)  shared state, isGm, navigation
  sections/
    NpcHeroSection.tsx                (~120 lines) portrait, name, status, edit/delete actions
    NpcIdentitySection.tsx            (~80 lines)  aliases, gender, age, species
    NpcAppearanceSection.tsx          (~60 lines)  appearance + GM notes
    NpcBackgroundSection.tsx          (~80 lines)  background + personality + motivation + flaws
    NpcGroupMembershipsSection.tsx    (~150 lines) add/remove groups, role/subfaction
    NpcLocationsSection.tsx           (~150 lines) presences with notes
    NpcRelationsSection.tsx           (~120 lines) social relations
    NpcSessionsSection.tsx            (~80 lines)  sessions where NPC appeared
    NpcVisibilitySection.tsx          (~60 lines)  visibility panel (gated on party)
  ui/
    NpcEditDrawer.tsx (existing — leave as-is)
pages/
  NpcDetailPage.tsx                   (~80 lines)  thin orchestrator
```

Total: still ~900 lines, but split into 9 self-contained units instead of one 895-line god component.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Regressions in user-visible behavior | User manual verification before each merge |
| Tests miss something | E2E test for the page covers happy paths |
| Section widgets duplicate Apollo queries (each fetches the same NPC) | Use Apollo cache-and-network policy or share via parent query — decide during pilot |
| Refactor turns into rewrite | Strict scope: one page at a time, no scope creep |
| New abstractions feel forced | Extract abstractions ONLY when 3+ instances exist, not preemptively |

---

## What this is NOT

- Not a framework migration (still React, Apollo, Tailwind)
- Not a state management swap (still Zustand + Apollo)
- Not a routing change (still react-router v7)
- Not a backend change (backend is untouched)
- Not a visual redesign (CSS unchanged)

Pure internal reorganization.

---

## Next session checklist

When picking up this plan in a new session:

1. Read this file (REFACTOR_PLAN.md) first
2. Check current branch and status: `git status`
3. Find which page is the next in the priority list
4. Confirm with user before starting
5. Create branch `refactor/<page-name>`
6. If frontend test infrastructure is not yet set up, set it up first as part of the pilot
7. Follow the workflow steps above
8. After merge, update the status column in the priority table above
