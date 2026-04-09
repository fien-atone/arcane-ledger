# Arcane Ledger — Product Vision

**Last updated**: 2026-04-10

This document describes what Arcane Ledger is, who it's for, and how it
differentiates itself. It's meant for anyone trying to understand the product
intent — new contributors, agents picking up work, or the maintainer coming
back after a break.

**Related docs:**
- [FEATURES.md](FEATURES.md) — what users can actually do right now
- [../BACKLOG.md](../BACKLOG.md) — prioritized work
- [ARCHITECTURE.md](ARCHITECTURE.md) — how the product is built

---

## What it is

Arcane Ledger is a web platform for running tabletop RPG campaigns. It serves
two distinct user roles — **Game Master** and **Player** — in a single shared
space, with controlled information asymmetry between them.

It is not a character sheet app. It is not a virtual tabletop. It is a
**narrative and knowledge-management tool** for groups that play in person or
hybrid.

---

## Users

### 🧙 Game Master

The GM runs one or more campaigns. Their job is to hold a large volume of
interconnected information in their head and keep the narrative coherent
between sessions.

**Pain points:**
- Information scattered across notes, chats, paper scraps, and memory
- Hard to track what players already know vs. what they don't
- Details forgotten between sessions — even details the GM invented themselves
- No fast way to look things up mid-session without breaking flow

**What they need from the platform:**
- A command center: all campaigns in one place
- Fast access to any entity during a session (locations, NPCs, factions, quests)
- Session journal with ability to log events as they happen
- Control over what players see (hide / reveal, per-entity and per-field)
- Relationships between entities: who knows whom, what's where, who knows what

### ⚔️ Player

The player participates in one or more campaigns. Their entry point is their
character. They see the world through their character's eyes: only what the
character has learned and experienced.

**Pain points:**
- Hard to remember what happened two sessions ago
- Unclear what the current state of a quest is
- No single place to see everything about their own character

**What they need from the platform:**
- Character sheet and current state
- Session journal from the character's point of view
- Known locations, NPCs, factions, quests — only the ones their character has encountered
- Active and completed quests
- Optional private notes, invisible to the GM

---

## The core mechanic: two layers of visibility

One of the central ideas of the platform is that **information exists in two
states**:

| State | Who sees it |
|---|---|
| 🔒 Hidden | Only the GM |
| 🔓 Revealed | GM + players it's been revealed to |

The GM controls reveals. An NPC can be known to the entire group, to only one
player, or to no one yet. Visibility is granular — per entity, and in some
cases per field ("players know this NPC exists but don't know their
motivation"). See [ARCHITECTURE.md](ARCHITECTURE.md#visibility-system) for
implementation details.

---

## Platform

**Web app.** Reasons:

- No installation required (critical for non-technical players)
- Works on any device, including tablets and phones at the table
- Convenient for shared access within a group

**Localization**: English and Russian are supported (implemented in 0.3.0 via
i18next).

**Offline mode**: not currently supported. Games typically run with at least
one connected device.

---

## Out of scope

What Arcane Ledger deliberately does not try to be:

- A character generator or full character sheet system with mechanics
  (that's a separate product)
- A map drawing tool — we integrate with existing ones, we don't build our own
- A virtual tabletop (VTT) — we do not compete with Roll20 or Foundry VTT
- A social network for TTRPG players

---

## Competitive positioning

| Product | Their focus | How we differ |
|---|---|---|
| **Notion / Obsidian** | General notes | No role model (GM/Player), no reveal system, no shared campaign context |
| **World Anvil** | Worldbuilding | Heavy, complex, expensive for most groups |
| **Campfire** | Fiction writers and GMs | No player-facing view, focused on solo creators |
| **Roll20 / Foundry VTT** | Virtual tabletop for remote play | We focus on narrative and data, not mechanics and maps |

**Our niche:** a lightweight, fast tool for groups that play in person or
hybrid and want to keep their narrative organized — without the overhead of
heavy worldbuilding platforms.

---

## Design principles

Derived from the product goals, these guide day-to-day decisions:

- **GM-first** — every feature should serve the GM's workflow first. Player
  features come second, built on the same data.
- **Edit-in-place** — prefer inline editing over drawers for existing data. A
  GM mid-session should not have to open a modal to fix a typo.
- **Dark-fantasy aesthetic** — visually consistent, calm, gold-and-dark
  palette. Not playful, not enterprise.
- **Speed over polish** — the GM is under time pressure during sessions. The
  app should feel fast. Pages load under 500ms.
- **Honest information architecture** — if the GM can see something they
  shouldn't have revealed, that's a bug. Visibility is a load-bearing feature,
  not decoration.
