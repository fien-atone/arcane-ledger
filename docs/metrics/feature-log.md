# Feature Log

One row per shipped feature, bug, or tech-debt item. See
[docs/metrics/README.md](./README.md) for format and estimation strategy.

Token counts are **dev-agent tokens only** — team-lead coordination tokens are
not counted. Treat as lower bound. See README for caveats.

## In progress

_(features that have a spec and estimate but are not yet merged)_

| # | Feature | Est. size | Confidence | Notes |
|---|---|---|---|---|

## Completed — with full metrics

_(features shipped under the new tracking system, starting with F-18)_

| # | Feature | Est. | Conf. | Actual | Match? | Agent tokens | Wall clock | Notes |
|---|---|---|---|---|---|---|---|---|

## Historical — backfilled without token data

_(major initiatives completed before the tracking system was introduced.
Token data was not captured at the time and cannot be recovered. Sizes are
retrospective best-effort guesses. Wall clock taken from git log range of
first to last commit on the effort.)_

| # | Initiative | Size (retro) | Wall clock | Notes |
|---|---|---|---|---|
| — | Tier 1–3 page decomposition (22 pages) | **XL** (split into 22 feature branches) | ~3 weeks | Each page was S–M individually. Detail pages generally M, list pages S. One L outlier: LocationDetailPage (1623 → 162 lines). |
| — | Phase 2 redundancy audit (SectionPanel, InlineConfirm, form constants, FormDrawer, useLinkedEntityList) | **L** overall, split into 5 M branches | ~1 week | Single-day per step except FormDrawer which was ~2 days due to drawer count (11). |
| — | F-11 server-side search / debounced filters across 10 list pages | **L**, split into 4 batches | ~3 days | Pilot took ~half a day. Batch of 5 entity lists ~1 day. Batch of 3 type lists ~half a day. Admin cleanup ~15 min. |
