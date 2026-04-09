# Future project — AI Team Observability Dashboard

**Status:** not started — prompt ready for a future session
**Author:** drafted 2026-04-11 by team-lead during Arcane Ledger work
**Project home:** not yet — this is the seed document for a new standalone project

## Context (for future me / you)

This is a standalone, reusable observability tool for Claude Code-based
agent teams. The idea came up while working on Arcane Ledger, where the
team has grown to 10 specialized agents + team-lead, and the complexity of
"who does what, when" became interesting enough to visualize.

The maintainer's original vision (captured verbatim from the conversation):

> A page where in pixel-art isometric style I can watch all these agents
> in real time — who went to whom, who asked what, what was answered. And
> where the instructions we introduced are like character profiles.

Key constraint from the conversation: this **must be a standalone project**
that can be plugged into any other project using Claude Code agents, not
just Arcane Ledger.

The maintainer chose to defer starting this project because they're
capacity-constrained (main project + job hunting). This file is a
self-contained prompt that can be pasted into a fresh Claude Code session
when time permits, and work can start immediately without reconstructing
the design conversation.

---

## The prompt — copy this into a fresh session

Start a new Claude Code session in a new directory (not inside any
existing project). Paste the entire block below as your first message.

---

> **Start of copy-paste block**
>
> I want to start a new standalone project: a universal observability
> dashboard for AI agent teams running under Claude Code (and potentially
> other agent runtimes later). This project is separate from anything
> else I'm working on — it will live in its own repository and be
> designed from day one to be pluggable into any Claude Code project as
> an external tool.
>
> ## What it is
>
> A local application that observes a Claude Code session (or multiple
> sessions across multiple projects) and visualizes the agent team in
> real time. The maintainer (me) wants to see:
>
> - All agents as "characters" with their current state (idle, working,
>   blocked, talking to someone)
> - Who called whom, with arrows or walking animations
> - A live event feed showing tool calls, agent invocations, user
>   prompts, completion events
> - A clickable profile per agent — the agent's system prompt, guard
>   rails, ownership list, call count, total tokens used
> - Stats per session: which agents worked the most, what was the token
>   cost, what was the typical call pattern
>
> The long-term aesthetic goal is a pixel-art isometric office where
> agents walk between rooms, but we will NOT start there. We will start
> with a functional 2D web dashboard and decide later whether pixel art
> is worth the investment.
>
> ## Constraints that matter
>
> 1. **Standalone and reusable.** This is not tied to any single project.
>    Any Claude Code project should be able to install a small adapter
>    and start sending events to the dashboard. The protocol between
>    adapter and dashboard must be stable and documented.
>
> 2. **Local-first.** No cloud, no telemetry to third parties. Everything
>    runs on the developer's machine. Optional multi-project support
>    (viewing several projects at once) works via a local WebSocket
>    server.
>
> 3. **Privacy-safe.** Message contents and prompt contents should NOT
>    be sent to the dashboard. Only metadata: who, when, what tool,
>    token usage, duration. This must be enforced at the adapter layer.
>
> 4. **Zero-impact on the observed session.** The adapter hooks must
>    run fast enough that they don't noticeably slow down the agent
>    session. Budget: under 50ms per hook call.
>
> 5. **Don't invent event categories that Claude Code doesn't actually
>    produce.** Every event type in the protocol must correspond to
>    something Claude Code hooks can emit. No fake events for "looks
>    better in the UI".
>
> ## The architecture I've sketched (treat as a starting point, you can
> change it with justification)
>
> Five layers:
>
> 1. **Agent protocol** — JSON-based, versioned. Documents exactly what
>    events look like, what fields they carry, what guarantees the
>    protocol makes (ordering, delivery, backpressure).
>
> 2. **Claude Code adapter** — an npm package (`@<name>/claude-adapter`)
>    that a user installs in their project. Provides an init command
>    that sets up `.claude/settings.json` with the right hooks. Each
>    hook receives the Claude Code event, transforms it into the
>    universal protocol, and forwards it to the broker.
>
> 3. **Event broker** — a local service that the adapter sends events
>    to and the dashboard reads from. Starting design: local WebSocket
>    server on a fixed port (or one from env var). Multiple projects
>    can connect at once.
>
> 4. **Dashboard UI** — a web app (Vite + React + TypeScript to match
>    what I'm used to). Shows the event feed, the agent roster, the
>    clickable profiles. Starting with 2D, not isometric.
>
> 5. **Profile discovery** — the dashboard reads `.claude/agents/*.md`
>    from connected projects, parses frontmatter and body, and uses
>    the content as agent profiles. This works for projects that
>    version their agent configs in git (like mine does).
>
> ## What I want from this session
>
> I need an **initial design + MVP plan**, not implementation yet. Deliver:
>
> 1. **Name the project.** Propose 3–5 names, I'll pick one. Leaning
>    toward TTRPG-themed ("Guild Hall", "Sentinel", etc.) but open.
>
> 2. **Validate the architecture** by actually reading the Claude Code
>    hooks documentation. Check:
>    - Which hook events are available (`PreToolUse`, `PostToolUse`,
>      `SessionStart`, `Stop`, `UserPromptSubmit`, any others)
>    - What data each hook receives
>    - Whether hooks fire inside sub-agent invocations or only in the
>      main session
>    - Whether there's a way to get agent usage data (token counts)
>      from hooks or whether we have to parse JSONL transcripts
>    - What the latency budget is (do hooks block the main thread?)
>    
>    Do not speculate. Read actual Claude Code docs or source and cite
>    what you found.
>
> 3. **Write the protocol spec** (short, 1–2 pages). One JSON example
>    per event type. List what the protocol does NOT include and why
>    (e.g., message contents excluded for privacy).
>
> 4. **Design the adapter interface.** What does `npx @<name>/init` do?
>    What files does it touch? How does it avoid breaking existing
>    `.claude/settings.json` if the project already has one?
>
> 5. **Propose a tech stack for each layer** with justification. Don't
>    reach for trendy things — reach for stable, boring, maintainable.
>
> 6. **Break the project into t-shirt sized milestones** (XS / S / M /
>    L / XL). XL milestones must be split. Show me a realistic path to
>    a working MVP.
>
> 7. **Identify the biggest risks** and how to de-risk them early. My
>    biggest worry: that Claude Code hooks don't actually expose enough
>    detail to make this interesting. The first milestone must be a
>    proof of concept that answers this worry.
>
> 8. **Propose a repo layout** for the monorepo (protocol + adapter +
>    broker + dashboard in one repo, or separate packages?).
>
> 9. **Output a README skeleton** for the eventual open-source release.
>    No marketing fluff. Factual description, installation, usage,
>    limitations.
>
> Do NOT start writing code yet. This session is for design,
> architecture, and planning only.
>
> ## Things I want you to assume about me
>
> - I know React, TypeScript, Vite, Tailwind. I'm comfortable in that
>   stack. Prefer it when it fits.
> - I know Node.js well enough to write small tools. Not a systems
>   programmer.
> - I have used Claude Code extensively and have a mental model of how
>   hooks, agents, and tool calls work. You don't need to explain the
>   basics.
> - I value honest trade-offs over rosy plans. If something is hard,
>   say it's hard.
> - I value small, shippable milestones over grand designs that take
>   months to produce anything visible.
> - I am the sole developer. There is no team for this project.
>
> ## Things I explicitly do NOT want
>
> - Don't design for "enterprise scale." This is a developer tool, not
>   SaaS.
> - Don't design for multi-user collaboration. One developer, their own
>   machine, their own sessions.
> - Don't depend on cloud services. No Firebase, no Supabase, no
>   hosted analytics. Everything local.
> - Don't add authentication. The dashboard is on localhost, auth is
>   the OS.
> - Don't propose building a "platform" that could host many tools. Keep
>   it narrow: observability for Claude Code agent teams. If it
>   generalizes later, that's bonus.
>
> ## My current hypothesis about what's hardest
>
> The hardest part will be **extracting enough signal from Claude Code
> hooks to make the visualization interesting.** If hooks only fire on
> user-facing tool calls and don't distinguish sub-agent work, the
> dashboard will look like "team-lead made 100 tool calls, nothing else
> happened" — which is boring and useless.
>
> The first thing I want to know after this planning session is whether
> my hypothesis is right. The design should include an early experiment
> to test it before any significant code is written.
>
> Go.
>
> **End of copy-paste block**

---

## Supporting notes — optional context for a future session

### Why this document exists

During an intense Arcane Ledger development sprint, the maintainer wanted
to start a pixel-art isometric dashboard for the agent team. Rather than
context-switch and derail the main project, we decided to capture the
full design intent in a prompt that can be used later in a fresh session.

This file is the result. It's committed to the Arcane Ledger repo for
versioning and findability, but the project it describes is explicitly
standalone.

### What's already known

- Claude Code supports hooks via `.claude/settings.json`. Hook events
  include at least: `PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`,
  `UserPromptSubmit`. These can execute shell commands.
- Each sub-agent invocation returns a `<usage>` block with
  `total_tokens`, `tool_uses`, and `duration_ms`.
- Claude Code writes session transcripts to
  `~/.claude/projects/<project-id>/<session-uuid>.jsonl` — visible in
  the `start-of-conversation` messages of any session.
- Arcane Ledger already versions `.claude/agents/*.md` in git (see
  [ADR-012](../adrs/ADR-012-specialized-team-agents.md)). Each agent
  has a frontmatter + system prompt + guard rails structure that is
  parseable and could serve as a "character profile" in the dashboard.

### What's unknown (and must be validated)

- Whether hooks fire inside sub-agent contexts or only at the top level
- Whether hooks can read the arguments of the tool call they're
  intercepting (e.g., can a `PreToolUse: Agent` hook see which
  sub-agent is being invoked?)
- What the actual latency impact of hooks is
- Whether token usage data is available to hooks or only via the
  transcript file after the fact
- Whether Claude Code rate-limits or throttles rapid hook invocations

These are listed in the prompt above as things the future session must
investigate.

### Starting points (read first in a fresh session)

- [Claude Code Hooks documentation](https://docs.claude.com/en/docs/claude-code/hooks)
- [Claude Code settings reference](https://docs.claude.com/en/docs/claude-code/settings)
- Arcane Ledger's [.claude/agents/](../../.claude/agents/) as an example
  of a versioned multi-agent team config
- Arcane Ledger's [ADR-012](../adrs/ADR-012-specialized-team-agents.md)
  for the rationale behind specialized agents — the dashboard will be
  most interesting when viewing a team with this kind of structure

### One warning for the future session

Do not start with pixel art. Start with a terminal or web 2D dashboard
that proves the data pipeline works end to end. Pixel art is a visual
upgrade that should only happen AFTER the data layer is solid. If you
start with art, you will spend weeks on spritesheets before knowing
whether the events you want to show are even available.

### What happens if this is never built

Totally fine. This file is a seed, not a commitment. Arcane Ledger does
not depend on this project in any way. If the maintainer never returns
to it, the only cost is this markdown file sitting in docs/
future-projects/. If you (reading this later) decide to kill the idea,
delete this file in a commit titled "docs: drop unrealized
agent-dashboard proposal" and move on.

### Naming suggestions already generated

- **Agent Observatory** — neutral, descriptive
- **Guild Hall** — TTRPG-themed, fits Arcane Ledger's world
- **Sentinel** — short, strong
- **Watchtower** — similar to Sentinel
- **Agent Stage** — theatrical metaphor, agents performing
- **The Roster** — simple, direct
- **Scriptorium** — medieval, suits an observability tool for writers of code
- **Aerie** — a high vantage point, elegant

The prompt asks the future session to propose its own names too. Use
whichever feels right at the time.
