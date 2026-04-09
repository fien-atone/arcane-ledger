# ADR-012: Specialized agent team (10 roles) with guard rails and documentation map

**Status:** Accepted
**Date:** 2026-04-10
**Decided by:** user + team-lead
**Related:** all other ADRs (this formalizes the team structure that
authored them)

## Context

The project is developed by a Claude Code session with sub-agents. For
much of the project's life the team was three agents: architect,
frontend-dev, backend-dev, coordinated by a team-lead (the main Claude
Code agent). As complexity grew, this structure showed strain:

- Tests were written by the same dev-agent that wrote the code → blind
  spots in coverage
- Documentation drifted because nobody specifically owned it
- Backlog grooming was ad-hoc and mixed with implementation
- Security review was implicit ("backend-dev also thinks about security")
  → not rigorous enough
- Schema changes went through architect, but most day-to-day schema work
  doesn't need architect-level thought
- UX decisions (microcopy, empty states, error messages) were left to
  frontend-dev's taste, which is code-focused, not user-focused
- Translation quality was left to frontend-dev as a side concern, and
  drifted

The user identified these gaps and requested specialized roles. Over two
sessions we designed the expanded team.

## Decision

The team now consists of **10 agents plus team-lead** (who is not a
sub-agent; team-lead is the main Claude Code session that orchestrates
the others). Each agent has:

- A dedicated config file in `.claude/agents/*.md`, versioned in git
- A **clear domain of ownership** (what files they edit)
- A list of **what they do NOT own** (to prevent turf wars)
- A **Guard Rails section** at the bottom with hard rules ("NEVER write
  production code", "NEVER commit", etc.)
- A description of **when to call them** vs. when not to

The 10 agents:

| Agent | Role | Ownership |
|---|---|---|
| **product-manager** | Backlog, specs, estimates, retrospectives | BACKLOG, docs/specs, docs/metrics |
| **architect** | **Escalation only** — fundamental decisions | docs/ARCHITECTURE.md (fundamental), docs/adrs |
| **data-engineer** | Data model, migrations, seed | prisma/schema.prisma, prisma/migrations, seed.ts, docs/ERD.md, docs/METAMODEL.md |
| **backend-dev** | Resolvers, auth, business logic | backend/src/ (not prisma, not security tests) |
| **frontend-dev** | React components, hooks, pages | frontend/src/ (not i18n locales) |
| **qa-engineer** | Integration/regression/E2E tests | *.test.*, e2e/, tests |
| **tech-writer** | Project docs, drift audits | docs/*, CLAUDE.md, README.md |
| **security-engineer** | Pre-merge security gate, threat model | __tests__/security/, docs/SECURITY.md |
| **i18n-curator** | Translation keys, quality, sync | frontend/src/shared/i18n/locales/ |
| **ux-designer** | UX design + review, microcopy | docs/specs (UX sections), docs/DESIGN_PRINCIPLES.md |

**Key role changes from the previous structure:**

1. **architect is now escalation-only.** The team runs autonomously on
   day-to-day work. Architect is called only for fundamental changes
   (new subsystems, stack changes, cross-cutting refactors, fundamental
   data-model rework, contract arbitration). This is a significant
   demotion in call frequency but an elevation in call importance. When
   architect is called, an **ADR is mandatory**.

2. **data-engineer owns schema.prisma**, not architect and not
   backend-dev. Backend-dev proposes what they need, data-engineer
   implements it. This split was driven by the realization that schema
   safety (migration mistakes, cascade bugs, seed drift) is a dedicated
   discipline that benefits from a dedicated owner.

3. **Guard rails are load-bearing.** Every agent config ends with a
   numbered list of "NEVER X" rules. This is the primary defense against
   role drift — an agent that accidentally drifts into another agent's
   territory gets reminded by its own config.

4. **Documentation Map in root CLAUDE.md.** A top-of-file table tells
   any new session "what you're looking for → where to look". This
   replaces the ambiguous "read the docs" instruction with a concrete
   index.

## Alternatives considered

- **Keep the 3-agent team** — would have worked longer but was already
  straining. Specialization has a cost (more coordination overhead) but
  the cost of NOT specializing was showing up as missed edge cases,
  stale docs, and low-quality translations.
- **Super-agent ("does everything")** — even more coordination overhead,
  plus blind spots compound rather than dividing.
- **Dynamic role assignment** — "whatever's needed, team-lead picks".
  Flexible but unaudioable. Fixed roles with explicit guard rails are
  more predictable.
- **Generic "developer" + "reviewer" split** — too coarse. Reviewer for
  what? Code? Security? UX? Docs? The roles naturally specialize; might
  as well make the specialization explicit.

## Consequences

**Positive:**
- Every file in the repo has an obvious owner
- Every type of work has an obvious agent
- Guard rails prevent role creep (in theory — to be observed in practice)
- ADRs are mandatory for architect invocations, so future sessions can
  always understand why a decision was made
- Translation quality is no longer a frontend-dev side concern
- Security is no longer an implicit expectation
- UX is no longer a code-centric afterthought
- data-engineer catches migration mistakes that backend-dev didn't know
  to look for
- The whole team is versioned in git (`.claude/agents/` was previously
  gitignored; now the exception is `.claude/agents/` and its contents
  are tracked)

**Negative:**
- More cognitive load for team-lead: "who do I call for this?" The
  Documentation Map + each agent's "when to call me" section mitigate
  this
- More coordination overhead in tokens: each feature involves more
  agent invocations
- Risk that agents are called when not needed, inflating cost. Partially
  mitigated by "when NOT to call me" sections
- Risk that team-lead doesn't call a needed specialist and ships worse
  work. Partially mitigated by mandatory gates (security-engineer for
  sensitive features, ux-designer for new UI)
- Many new files to maintain; new contributors face more config surface

## Notes

The 10-agent team is expected to be the **stable configuration**. No
further expansion is planned. Candidate roles that were discussed and
deferred:

- **release-manager** — no release cycle yet
- **dependency-manager** — team-lead handles manually
- **database-query-optimizer** — overkill for this scale
- **devops / infra** — deferred to production prep (explicitly out of
  scope for now per user)
- **copy-writer / marketing** — no marketing goals

If a new role becomes necessary, this ADR gets superseded by a new one
that explains why.

The first feature to be implemented under the new team structure is
F-18 (rate limiting on login). It will be the pilot run: we'll see
whether the canonical 13-step lifecycle in root CLAUDE.md produces the
expected quality and cost, or whether the structure needs adjustment.
