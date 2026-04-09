# Metrics — how we track feature effort

This directory is the development journal for Arcane Ledger. Every feature we
ship gets logged here so we can learn from our own history.

**Maintained by:** product-manager agent
**Read by:** team-lead (at start and end of each feature), user (any time)

## Why we track this

Estimates are always guesses. The point is not to make the guesses more
accurate — the point is to see **patterns in how we are wrong**, so we can
adjust. After 10–20 features, we should be able to say things like:

- "cross-cutting refactors in this project are consistently one size larger
  than we think"
- "backend-only features land close to estimate; frontend features drift"
- "features with confidence 'low' are wrong twice as often as 'medium'"

These patterns are actionable. Individual estimate errors are not.

## The estimation strategy — T-shirt sizes only

We do NOT estimate in hours. Hours look precise but aren't. T-shirts are
honest about the range.

| Size | Range (senior dev, manually) | Typical example |
|---|---|---|
| **XS** | < 1h | cosmetic fix, rename, typo, copy change |
| **S** | 1–3h | single-file change, one query hook, one resolver, one small section |
| **M** | 3–8h | multi-file, one domain, includes tests. **Default for most features.** |
| **L** | 8–20h | cross-cutting, multiple domains, migration, new subsystem |
| **XL** | 20h+ | **must be split before committing** — this is an initiative, not a feature |

The ranges are deliberately wide. A feature inside the "M" range can take 3
hours or 8 hours and we still say "M was right". Only if reality is closer to
"L" or "S" do we count it as an estimate miss.

### Confidence level

Every estimate comes with a confidence level:

- **high** — we've done this exact pattern before, it's a known quantity
- **medium** — we know how to do it, but there are 1–2 unknowns
- **low** — there are genuine unknowns; reality may surprise us

Low confidence is not a bad thing. It's a flag that says "track this carefully,
it may teach us something".

### XL rule

If an estimate comes out XL, the PM must propose a breakdown into L/M pieces
**before** the work starts. XL means the spec is too big, not that the effort
is too big. Initiatives like "build AI subsystem" or "rewrite social graph" are
XL and must be split.

## What gets logged

Two files per feature:

### 1. `feature-log.md` — the one-line summary

One row per feature, in the big table. Columns:

| Column | Meaning |
|---|---|
| # | Feature ID from BACKLOG (F-18, B-1, T-8, etc.) |
| Feature | Short title |
| Est. size | Size at start (XS/S/M/L/XL) |
| Confidence | high/medium/low |
| Actual size | Size in retrospect — what size should it have been if we knew what we know now |
| Match? | ✅ exact, ⚠️ +1/−1 size, ❌ +2/−2 or worse |
| Agent tokens | Sum of `total_tokens` across all agent invocations for this feature (dev-agents only, does not include team-lead coordination) |
| Wall clock | Time from first commit of the feature branch to the merge commit |
| Notes | 1–2 sentences about what explains any mismatch |

### 2. `F-XX.md` — the detailed record

One file per feature with the full story:

- Start / end dates
- Who (which agents) did the work and for how long (agent `duration_ms` sum)
- Per-agent token usage
- The reason for any estimate miss
- Surprises encountered (the honest post-mortem — what went wrong that we
  didn't expect)
- Links to the commits and spec

## How to read the log

### Spotting systematic bias

If more than half of completed features show the same direction of miss (all
⚠️ +1 or all ❌ +2), we are systematically underestimating. Time to recalibrate
the size definitions or the heuristics.

### Spotting risky feature classes

Group features by type (refactor, new feature, bug fix, cross-cutting). If one
class drifts more than others, that class deserves more careful estimates.

### Checking agent effectiveness

The per-agent token breakdown in each `F-XX.md` shows where the effort went.
If frontend-dev consistently burns 4x more tokens than backend-dev for similar
work, something is off — either the task was misassigned, or frontend-dev needs
better instructions, or the codebase is harder on the frontend.

## Known limitations of the token accounting

The agent token count in `feature-log.md` is **not** a complete picture of
what the feature cost.

1. **Team-lead coordination tokens are NOT counted.** The main agent (me,
   running this Claude Code session) also spends tokens on planning,
   delegation, review, and responding to the user — but those tokens are not
   exposed as a structured `usage` field that sub-agents return. They're
   lost to the log. As a rough rule, team-lead coordination is probably
   ~20–30% of the true total, but this is a guess.

2. **Background tasks may not report usage.** Agents launched with
   `run_in_background: true` sometimes don't return a usage block. If that
   happens, the log will note "background task — usage unavailable".

3. **User's own cost is unknown to me.** The Claude Code runtime has this
   data (`/cost`), but it's not accessible from inside my context. If the
   user wants true total cost, they must read it from Claude Code directly
   and add it to the record manually.

Given these caveats, treat `feature-log.md` numbers as **lower bounds** and
useful for **comparison across features**, not as absolute cost reports.

## Workflow — how PM maintains the log

### At the start of a feature

1. Team-lead says "we're starting F-18".
2. PM reads the BACKLOG line and writes `docs/specs/F-18.md`.
3. PM estimates the size + confidence and records them in the spec.
4. PM adds a **partial row** to `feature-log.md` with size/confidence filled in
   and the other columns empty.

### During the feature

PM does nothing. The dev-agents and team-lead do the work. Each agent
invocation returns a `usage` block — team-lead keeps a running scratch of
tokens to pass to PM at the end.

### At the end of a feature

1. Team-lead says "F-18 is merged, here are the agent usage numbers and the
   commit range".
2. PM reads the spec, updates it with:
   - Status → done
   - Actual size (honest retrospective size)
   - Retro notes (1–3 sentences)
   - History entry with commit range
3. PM completes the row in `feature-log.md` with the final numbers.
4. PM creates `docs/metrics/F-18.md` with the detailed breakdown.
5. PM moves the backlog line to the Completed section.

## Retrospective cadence

Every 5 completed features, team-lead asks PM: "review the log, what patterns
do you see?" PM reads the last 5 rows, writes a short report, team-lead
decides whether to adjust anything.

First retrospective: after F-22 closes (F-18, F-22, F-23, F-24, F-25 = 5
features — the first honest run with the new system).
