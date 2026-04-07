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
| **1** | **NpcDetailPage** | 895 → 112 | ✅ done | Pilot shipped. 10 sections + 1 hook + 11 test files (25 tests). Test infra set up: Vitest + Testing Library + Apollo MockedProvider. Lessons: Apollo v4 MockedProvider drops `addTypename` prop; `MockedResponse` type lives at `MockLink.MockedResponse<any, any>`. |
| 2 | SessionDetailPage | 705 | pending | Recently touched, we know the code. Sections: header, navigation, brief, notes, NPCs, locations, quests. |
| 3 | GroupDetailPage | 457 | pending | Similar shape to NpcDetailPage. Sections: header, description, goals, symbols, members, social relations. |
| 4 | CharacterDetailPage | 433 | pending | Mini-NPC shape. Sections: hero, identity, backstory, motivation, bonds, flaws, group memberships. |
| 5 | QuestDetailPage | 325 | pending | Smaller but still benefits. Sections: header, description, reward, giver, sessions, GM notes, visibility. |
| **6** | **LocationDetailPage** | **1620** | **last in tier** | Largest and most dangerous. Save for when we have a proven pattern. Sections: header, map, children, NPCs present, sessions, quests, containment, visibility. |

### Tier 2 — List pages (different pattern)

List pages decompose into: `hooks/useXxxList.ts` (data + filters state) + `sections/XxxFilterBar.tsx` + `sections/XxxList.tsx` + optional `sections/XxxPreview.tsx` for pages with a right-side preview panel.

| # | Page | Lines | Status | Notes |
|---|---|---|---|---|
| 7 | LocationTypesPage | 717 | pending | Biggest list-like page. Has graph/tree visualisation + type forms. |
| 8 | PartyPage | 606 | pending | Three lists: members, pending invitations, unassigned characters. Already has sections to extract. |
| 9 | LocationListPage | 313 | pending | Filters by type, parent grouping. Has preview panel. |
| 10 | SpeciesTypesPage | 262 | pending | Type CRUD, small list. |
| 11 | NpcListPage | 255 | pending | Filters by status. Has preview panel. |
| 12 | GroupTypesPage | 253 | pending | Type CRUD. |
| 13 | GroupListPage | 214 | pending | Filters by type. Has preview panel. |
| 14 | QuestListPage | 204 | pending | Filters by status. |
| 15 | SessionListPage | 195 | pending | Simple date-sorted list. Borderline — could leave. |
| 16 | SpeciesPage | 187 | pending | Species list with preview. Borderline. |

### Tier 3 — Top-level pages (cross-domain, no single feature owner)

These don't live in a single `features/<domain>/`. Sections go into `widgets/<page-name>/` or a dedicated `pages/<page>/sections/` folder.

| # | Page | Lines | Status | Notes |
|---|---|---|---|---|
| 17 | CampaignDashboardPage | 588 | pending | Widget-shaped by nature. Sections: next session, recent sessions, calendar, party, recent NPCs, section toggle. |
| 18 | SocialGraphPage | 498 | pending | Mostly D3 logic already isolated. Mostly orchestration. |
| 19 | CampaignsPage | 381 | pending | List + calendar widget + create drawer. |
| 20 | LandingPage | 267 | pending | Marketing copy. Sections: nav, hero, stats, features, roadmap, contact, CTA. |
| 21 | AdminUsersPage | 262 | pending | Table + create/edit drawer. Admin-only. |
| 22 | ProfilePage | 261 | pending | Form with profile info + language + password change. |

### Not refactoring (too small, no benefit)

| Page | Lines | Why skipped |
|---|---|---|
| SpeciesDetailPage | 171 | Small, simple |
| LoginPage | 144 | Already thin |
| NpcDetailPage | 112 | ✅ done |
| ChangelogPage | 97 | Thin |

**Total to refactor: 21 pages remaining.**

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
