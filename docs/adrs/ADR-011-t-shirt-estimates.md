# ADR-011: T-shirt sizes, never hours, for effort estimation

**Status:** Accepted
**Date:** 2026-04-10 (retrospective, when metrics infra was set up)
**Decided by:** user + team-lead
**Related:** `docs/metrics/README.md`, product-manager agent config

## Context

The project needed an effort-tracking system: estimate how much work each
feature will take, compare to actual effort, spot patterns. The natural
default is hours.

But hours are a lie at this scale. An estimate of "3 hours" that takes 6
hours is "100% off". An estimate of "3 hours" that takes 5 is "66% off".
These precision numbers look like signal but they're mostly noise, because
neither the estimator nor the actor can realistically distinguish 3 hours
from 5 hours of work on a cross-cutting feature. The user made this
argument directly: "оценка из головы, и у человека тоже".

T-shirt sizes embrace the coarseness honestly. A size "M" can take 3 hours
or 8 hours and we call the estimate correct. Only when reality lands in a
**different size bucket** do we count it as an estimate miss.

## Decision

Effort estimates use **t-shirt sizes** with documented ranges:

| Size | Range (senior dev, manually) |
|---|---|
| XS | < 1h |
| S | 1–3h |
| M | 3–8h (**default**) |
| L | 8–20h |
| XL | 20h+ (**must be split before committing**) |

Plus a **confidence level** (high / medium / low) that reflects how sure
the estimator is.

Estimation is done by product-manager, recorded in the feature spec
(`docs/specs/F-XX.md`) and in `docs/metrics/feature-log.md`.

After merge, PM records the **actual size** (what size it should have
been if we knew what we know now). The comparison is:
- ✅ exact match
- ⚠️ off by one size (e.g., estimated M, actual L)
- ❌ off by two+ sizes

The goal is not to make individual estimates correct. The goal is, after
5–10 features, to see **patterns in how we are wrong** — and adjust.

XL is always forbidden at commit time. An XL estimate triggers a
breakdown into L/M pieces before work begins. This prevents "we're doing
a timeline subsystem" from being treated as one feature.

## Alternatives considered

- **Hours** — standard but noisy. The user explicitly rejected this.
- **Story points (Fibonacci: 1, 2, 3, 5, 8, 13)** — similar to t-shirts
  but with more buckets. The extra buckets are fake precision — the gap
  between "5" and "8" is no more measurable than between "M" and "L".
- **No estimates** — works in theory, but then we can't tell whether the
  team is getting better or worse over time, and we can't spot systematic
  over/undercommitment.

## Consequences

**Positive:**
- Estimates are honest about their coarseness — no false precision
- "Patterns over individuals" mindset: one miss is noise, three misses
  in the same direction are signal
- XL rule forces big initiatives to be decomposed before they eat months
- Aligns with how product-manager actually thinks — by rough bucket, not
  by stopwatch

**Negative:**
- "T-shirt sizes" feel squishy to people used to hour-based estimates
- Can't directly compare across projects using different conventions
- Requires discipline to record actual size honestly after the fact —
  easy to rationalize "it was M, I just went over a little"

## Notes

The first feature estimated under this system is F-18 (rate limiting on
login). After 5 completed features (F-18 + F-22 + F-23 + F-24 + F-25),
product-manager runs a retrospective: what patterns did we see?

Historical initiatives (Tier 1–3, Phase 2, F-11) were backfilled into
`feature-log.md` with retrospective sizes but no token data — those were
captured before the metrics system existed.

Token counts (per agent, per feature) are logged alongside size data but
are known to be a **lower bound** because team-lead's own tokens are not
exposed. See `docs/metrics/README.md` for the full caveat.
