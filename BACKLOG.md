# Arcane Ledger — Backlog

Task tracker for bugs, features, and improvements. Managed by the team lead.

Legend: `🔴` critical · `🟡` important · `🟢` nice to have · `✅` done · `🚧` in progress

---

## In Progress

_Nothing currently in progress._

---

## Bugs

| # | Priority | Description | Assigned |
|---|---|---|---|
| B-1 | 🟡 | Campaign create uses client-side ID fallback if server response is slow | — |
| B-2 | 🟡 | Session/Quest drawers still generate client-side IDs (`generateId()`) instead of letting server create | — |
| B-3 | 🟢 | Social relations: `char-alvin` link on NPC pages may not resolve name if party data hasn't loaded | — |

---

## Features

| # | Priority | Description | Assigned |
|---|---|---|---|
| F-1 | 🔴 | End-to-end testing: verify all pages work with GraphQL backend (not just build) | — |
| F-2 | 🟡 | Seed script: migrate mock data (NPCs, locations, sessions, quests, groups) into Postgres | — |
| F-3 | 🟡 | GraphQL subscriptions: real-time updates when data changes | — |
| F-4 | 🟡 | Role-based field visibility: hide GM Notes from players | — |
| F-5 | 🟡 | Campaign invitations: invite users to campaign as player | — |
| F-6 | 🟢 | AI integration: NPC description generation via Claude API | — |
| F-7 | 🟢 | AI integration: session summary generation from notes | — |
| F-8 | 🟢 | Export: PDF character sheets, session summaries | — |
| F-9 | 🟢 | Dice roller: persist roll history per session | — |
| F-10 | 🟢 | OAuth login (Google/Discord) | — |

---

## Tech Debt

| # | Priority | Description | Assigned |
|---|---|---|---|
| T-1 | 🟡 | Remove mock repositories and mockData after full backend migration | — |
| T-2 | 🟡 | Add GraphQL codegen for type-safe Apollo hooks (replace `<any>` casts) | — |
| T-3 | 🟢 | Unify enum casing: frontend lowercase ↔ backend UPPERCASE mapping is fragile | — |
| T-4 | 🟢 | Add error boundaries and proper GraphQL error handling in UI | — |
| T-5 | 🟢 | Containment rules: seed data not migrated to Postgres yet | — |
| T-6 | 🟢 | Group types: seed data not migrated to Postgres yet | — |

---

## Completed (recent)

| # | Description | Version |
|---|---|---|
| ✅ | Backend scaffolded: Apollo Server + Prisma + Postgres + Docker | — |
| ✅ | All 11 query files migrated from TanStack Query to Apollo Client | — |
| ✅ | Login flow updated for GraphQL backend | — |
| ✅ | Agent team configured: architect, frontend-dev, backend-dev | — |
| ✅ | Quests CRUD, social relations editing, BG3-style bars | 0.2.3 |
| ✅ | Dashboard overhaul, campaign list, session badges | 0.2.2 |
| ✅ | Sessions, LocationIcon, unified UI patterns | 0.2.1 |
