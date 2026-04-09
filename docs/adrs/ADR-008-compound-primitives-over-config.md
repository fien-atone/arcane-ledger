# ADR-008: Compound components and hooks-first for shared primitives

**Status:** Accepted
**Date:** 2026-04-08 (retrospective, Phase 2 redundancy audit)
**Decided by:** user + team-lead
**Related:** ADR-007 (section widgets)

## Context

After Tier 1–3 decomposition, the section widgets were deliberately
"naive" — each page got its own sections without trying to share code.
Once all 22 pages were decomposed, patterns became visible: 83 copies of
a card-panel header, 19 copies of an inline Yes/No confirm, 11 copies of
an edit drawer's outer chrome, 8 sections doing identical "linked entity
picker" state, 15 files with copy-pasted `LABEL_CLS` / `INPUT_CLS` strings.

Phase 2 was the redundancy audit: extract these patterns without
introducing the classic abstraction problems.

The existing `shared/ui/Select.tsx` was a warning sign. It was a
reasonable component that had accumulated four optional props
(`dot`, `icon`, `iconColor`, `group`) as new use cases came in. Each
prop was fine in isolation, but together they made the API noisy and
the component harder to understand. A bigger `<FormDrawer>` or
`<LinkedEntityListSection>` with the same accretion pattern would be
much worse.

## Decision

Two rules for Phase 2 extraction:

1. **Compound components over config objects.** When a primitive has
   variants or sub-parts, expose them as named subcomponents, not as
   configuration props:

   ```tsx
   // Compound (good)
   <FormDrawer open onClose>
     <FormDrawer.Header title="Edit NPC" onClose={onClose} />
     <FormDrawer.Body>{fields}</FormDrawer.Body>
     <FormDrawer.Footer onSave={handleSave} saving={saving} />
   </FormDrawer>

   // Config object (bad)
   <FormDrawer
     open
     onClose
     headerTitle="Edit NPC"
     headerSubtitle={...}
     bodyPadding={6}
     footerPrimaryLabel="Save"
     footerPrimaryAction={handleSave}
     footerShowSpinner={saving}
   />
   ```

2. **Hooks over components when the thing knows about data.** If the
   abstraction encapsulates state + data-fetching logic, it's a hook,
   not a component. The JSX stays in each caller because render-layer
   variations are too diverse to unify safely.

   - `useInlineConfirm` is a hook. The tiny `<InlineConfirm>` component
     renders only the universal "Yes / No" UI.
   - `useLinkedEntityList` is a hook. There is no
     `<LinkedEntityListSection>` component because the render varies
     too much across callers (status pills, notes editing, dual slots
     in GroupMembers).

## Alternatives considered

- **Generic `<LinkedEntityListSection<T>>` component** — rejected. The
  eight linked-entity sections have too much divergence in what they
  render. A component would have grown an optional flag per divergence
  (see `Select.tsx` warning sign).
- **Config object for `FormDrawer`** — rejected for the same reason.
- **Leave the duplication alone** — considered briefly. The decomposition
  had already delivered the main value. Phase 2's marginal benefit was
  smaller than Tier 1–3's. But specific duplications (the 11 drawers,
  the 83 card-panels) were painful enough that extraction paid off.

## Consequences

**Positive:**
- 5 new shared primitives extracted (`SectionPanel`, `InlineConfirm`,
  `form.ts` constants, `FormDrawer` compound, `useLinkedEntityList`)
- 112 files migrated
- −433 lines of code overall (mostly in the 11 drawers and the
  83 card-panel wrappers)
- +48 colocated tests for the new primitives
- Single source of truth for card-panel layout, confirm UI, drawer
  chrome, form inputs, and picker state — change once, affect
  everywhere

**Negative:**
- Compound components are less discoverable via autocomplete than flat
  prop APIs (you have to know about `FormDrawer.Header`)
- Stack traces for bugs in shared primitives land in `shared/ui/`, one
  level removed from the domain code that called them
- If someone ever decides to "polish" a primitive by adding optional
  props, we're back to the `Select.tsx` problem. Guardrails in each
  primitive's code comments should help: "200-line limit; if it grows
  past that, revisit this ADR."

## Notes

Two near-misses inform this decision:

1. `shared/ui/Select.tsx` — concrete evidence that accumulating optional
   props is a real tendency in this codebase.

2. The initial FormDrawer pass (before user feedback) had stripped the
   per-drawer subtitles because "they were bespoke". Restoring them
   required a narrow `subtitle?` prop — **exactly one** optional prop,
   not a pile of them. The restoration is the point: the discipline is
   "minimum props that handle real divergence, nothing more".

F-22 (restore chip counts) is the next test of this discipline. Adding
a second `useEntityListPage` hook for counts, rather than extending the
existing list hooks with optional count-aggregation logic, is the
hooks-first path.
