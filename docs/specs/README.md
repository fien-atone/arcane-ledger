# Feature Specs

One file per feature, named by ID from `BACKLOG.md`: `F-18.md`, `B-1.md`,
`T-9.md`, etc.

**Maintained by:** product-manager agent
**Created when:** the team-lead decides a feature is next up for implementation
**Closed when:** the feature merges to develop

## Why specs live here (not in BACKLOG.md)

`BACKLOG.md` is the top-level index — one line per feature, scannable, for
quick "what's next" decisions. It's the table of contents.

Specs are detailed — what exactly we're doing, what's explicitly out of
scope, what "done" means, what we don't yet know. They're the chapter.

Keeping them separate means BACKLOG stays readable as it grows to 100+ items,
and specs can be as detailed as they need to be without bloating the index.

## Template

Every spec must include **all** the sections below. Sections marked _optional_
can be empty but the header must be present.

```markdown
# F-XX: Short title

**Status:** ready | in progress | done | rejected | deferred
**Priority:** 🔴 critical | 🟡 important | 🟢 nice to have
**Estimated size:** XS | S | M | L | XL
**Confidence:** high | medium | low
**Depends on:** (other F-XX IDs or —)
**Blocks:** (other F-XX IDs or —)

## Problem

Plain-language description of what's broken or missing. One paragraph, max
three sentences. Imagine someone reading this who has never seen the codebase.

## Goals

- [ ] Specific thing that must be true when this is done
- [ ] Another specific thing
- [ ] ...

## Out of scope

- Things that sound related but are NOT part of this feature
- Things that are obviously part of a future feature
- Things we discussed and explicitly decided not to do

## Acceptance criteria

- [ ] How we can verify the feature is done (test criteria, observable behavior)
- [ ] Reference to specific tests, error messages, UI changes
- [ ] Must be falsifiable — "works correctly" is not a criterion

## Open questions

(Questions that must be answered before work starts. Mark each with who is
expected to answer.)

- (team-lead) Should we use in-memory store or Redis for rate limit state?
- (architect) Does the new resolver need a role check?

## Technical notes _(optional)_

Short technical guidance from architect, if any. Not a full design doc —
just pointers to relevant files, gotchas, or patterns to reuse.

## History

- YYYY-MM-DD — created from user request / BACKLOG item
- YYYY-MM-DD — status change / significant edit
- YYYY-MM-DD — merged in commits abc123..def456

## Retro notes _(filled after merge)_

What went as expected, what didn't, what we learned. 1–3 sentences. Honest.
If the estimate was off, say why.
```

## Lifecycle

1. **Draft** — PM is writing the spec, still gathering info. Don't start work yet.
2. **Ready** — spec is complete, all required sections filled, open questions answered. Dev work can start.
3. **In progress** — first commit on the feature branch has landed.
4. **Done** — feature is merged to develop. Retro notes filled in.
5. **Rejected** — after review, feature is closed without being built. Spec stays as a record of the decision and the reason.
6. **Deferred** — feature is postponed. Spec stays, but BACKLOG priority drops and an explanation is added to history.

## Rules

- **No spec, no work.** Any feature larger than XS requires a spec before a feature branch is created. XS can skip the spec and go straight to a commit.
- **Acceptance criteria must be falsifiable.** "Works correctly" is not an acceptance criterion. "All tests green, error is translated in EN and RU, page loads under 500ms" is.
- **Out-of-scope is required.** Every spec must list what it's NOT doing. This prevents scope creep and makes retro analysis easier.
- **Open questions block "ready".** If there are unanswered questions, status stays at draft. Ship the questions back to team-lead to route to architect / user.
- **History is append-only.** Don't rewrite past entries. Add new ones.
- **One spec per BACKLOG item.** If you're writing multiple specs for one feature, the feature is too big — split it in the backlog first.
