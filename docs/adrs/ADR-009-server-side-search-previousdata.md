# ADR-009: Server-side search with Apollo v4 `previousData` to prevent flicker

**Status:** Accepted
**Date:** 2026-04-09 (retrospective, F-11 completion)
**Decided by:** user + team-lead
**Related:** ADR-001 (GraphQL), ADR-008 (hooks-first), F-11 in Completed

## Context

All list pages (NPCs, Locations, Sessions, Quests, Groups, Species, and
all type pages) originally filtered data client-side: the hook loaded the
full list from GraphQL and ran `useMemo(() => list.filter(...))`. This is
fine for small datasets but scales badly — a campaign with 500 NPCs loads
all 500 on every page visit.

An earlier attempt to move GroupTypes filtering to the server was reverted
because it caused **list flicker**: on every keystroke the list briefly
went blank before the new results arrived. Client-side filtering was then
reinstated with a comment explaining the regression, and F-11 was marked
in the backlog as "do this properly after the refactor finishes".

By 2026-04-09 the groundwork was in place (uniform `useXxxListPage` hooks
from Tier 1–3, shared `useDebouncedSearch` from Phase 2) and we returned
to server-side search. The flicker problem had to be solved.

## Decision

Server-side search across all list pages, with **three mechanisms**
preventing flicker:

1. **Debounced input (300ms).** Search input state updates immediately
   (for responsiveness), but the GraphQL variable only updates 300ms
   after the last keystroke. A single query fires per pause, not one
   per character.

2. **Apollo v4 `previousData`.** Apollo's `useQuery` natively exposes
   `previousData` on the result. We coalesce `data ?? previousData` in
   our hooks, so the list stays visible with the previous results while
   the new query is in flight. Combined with `notifyOnNetworkStatusChange:
   true`, this gives a smooth "keep old, swap to new" transition.

3. **`GlobalLoadingBar`.** An already-existing top-of-page progress
   indicator shows when any Apollo request is in flight for >200ms. This
   makes the loading state visible without hiding the content.

URL params stay in sync on every keystroke (for refresh / back-forward
preservation); only the GraphQL variable is debounced.

## Alternatives considered

- **Client-side filtering only** — the status quo. Doesn't scale.
- **`fetchPolicy: 'cache-and-network'`** — Apollo caches return instantly
  for seen variables, then updates from the network. Would work, but our
  global cache is disabled (`no-cache` policy), which it was for
  unrelated debugging reasons. Enabling cache for list queries would be
  a larger change.
- **Custom "keep-previous-data" via `useRef`** — works, but more moving
  parts than needed now that `previousData` is a first-class feature in
  Apollo v4.
- **Optimistic responses** — irrelevant; this isn't a mutation.
- **Client-side with pagination** — delay the scale problem rather than
  solve it. Rejected for the same reason.

## Consequences

**Positive:**
- All 10 list pages filter on the server, scaling to arbitrary campaign
  sizes
- Flicker is eliminated; the user sees a smooth swap, not a blank state
- Single `useDebouncedSearch` hook reused across all list pages (5 lines
  per caller) — no per-feature debounce code
- The uniform refactor uncovered and fixed a URL-echo bug in
  `useDebouncedSearch` (initial version re-synced on every `initialValue`
  change, which accidentally bypassed the debounce when callers updated
  URL synchronously on every keystroke)

**Negative:**
- Filter chip counts were dropped. Server-side filtering means the
  response only contains matching rows, so we can't compute
  "Alive (12)" from the filtered result. Tracked as **F-22** in the
  backlog for restoration via separate aggregation queries
  (`npcCountsByStatus`, etc.). Chips now show labels without numbers.
- Mutations that refetch now use **named** `refetchQueries: ['Npcs']`
  instead of the inline-variables form, because the active query has
  variable values that naked refetches wouldn't match
- Cross-feature test mocks had to be updated everywhere the affected
  query was mocked for a section's own purposes
- Sessions `Next session` / `Previous session` badges are now computed
  from the filtered result set during an active search. A second
  unfiltered query (`useLastSession` pinned to `search: null`) keeps the
  Dashboard correct

## Notes

The debounce fix for URL-echo is recorded as a test in
`frontend/src/shared/hooks/useDebouncedSearch.test.ts` —
`'does NOT bypass debounce when initialValue echoes a value we just setValue'`.
This is the kind of bug that's invisible in isolated hook tests but
obvious in integration; a useful data point for future hook design.

F-22 (restore chip counts via aggregation queries) is the direct
follow-up. It's not a regression fix — it's a tradeoff we knowingly
accepted to ship F-11 in the shape of discrete batches rather than
a monster PR.
