# Features — Arcane Ledger

**Last updated**: 2026-04-07  
**Current version**: 0.3.1

This document describes what users can do in the app, organized by domain. It's intended for newcomers, product planning, and as a checklist of what's already shipped vs. what's in the backlog.

---

## Roles

The app distinguishes two kinds of roles:

- **System role** (per user account): `USER` (default) or `ADMIN` (full system access, can manage other users)
- **Campaign role** (per user-campaign pair): `GM` (full control of the campaign) or `PLAYER` (read-only with visibility restrictions)

---

## Campaigns

A campaign is the top-level container for everything: NPCs, locations, sessions, etc.

- Create a new campaign — becomes its GM automatically
- Update title and description (inline rich-text editing on dashboard)
- Archive / restore campaigns (separate sections in the campaign list)
- Toggle which sidebar sections are enabled per campaign (NPCs, Locations, Quests, Sessions, Party, Groups, Species, Social Graph, plus Types subsections)
- Dashboard shows: next session, recent sessions, party, recent NPCs, calendar with sessions
- Campaign list shows GM/Player role icon next to each campaign, sorted GM-first then alphabetically
- Calendar widget shows scheduled sessions across all campaigns

---

## NPCs (Non-Player Characters)

- Create, edit, delete NPCs (name, status, gender, age, species, aliases)
- Rich detail page with: portrait, appearance, personality, background, motivation, flaws, GM notes
- Portrait upload with lightbox preview
- Status indicators: Alive, Dead, Missing, Unknown
- Link NPCs to groups (with role/subfaction notes)
- Link NPCs to locations (with presence notes — "evenings", "during festivals", etc.)
- Social relations between NPCs (5-level friendliness scale, optional notes)
- View all sessions where an NPC appeared
- Visibility controls: GM picks which NPCs and which fields are visible to players

---

## Locations

- Hierarchical world: regions → settlements → districts → buildings, etc.
- Customizable location types per campaign (e.g., City, Forest, Dungeon, Ruins) with category-based color coding
- Location detail: description, image/map, parent location, type-specific fields
- Map viewer: upload image, place numbered markers, link markers to child locations or NPCs
- Mini-map preview in child locations showing position on parent map
- NPC presence list with notes
- Sessions where the location was visited
- Notable places (sub-locations grouped by type)
- Containment rules: per-type-pair, configurable (e.g., "City can contain District")
- Visibility controls: hide entire locations or specific fields from players

---

## Sessions

- Create sessions with auto-incremented number
- Title, datetime, brief (public), GM notes (private), my notes (per-user private)
- Link NPCs / Locations / Quests that appeared in the session
- Calendar export: Google Calendar URL or downloadable .ics file
- Previous/Next navigation between sessions
- Visibility toggles for linked entities (when Party module is enabled)
- Session list with badges: Today, Tomorrow, Next, Previous

---

## Quests

- Create, edit, delete quests
- Status lifecycle: Active → Completed / Failed / Unavailable / Undiscovered
- Quest fields: description, reward, GM notes, optional NPC giver
- Linked sessions (where the quest progressed)
- Status filter on list page
- Visibility controls per quest

---

## Party & Characters

- Player character profiles: name, image, gender, age, species, class
- Rich-text fields: backstory, motivation, bonds, flaws, GM notes, appearance, personality
- Inline WYSIWYG editing on character page
- Character image upload with lightbox
- GM creates characters and assigns them to invited players
- Players see "My Character" highlighted at top of party page
- Group memberships per character

---

## Groups (Factions, Guilds, Cults, etc.)

- Customizable group types (e.g., Faction, Guild, Family, Cult, Council)
- Group fields: description, goals, symbols/insignia, GM notes
- Member management: add NPCs and characters with role and subfaction
- Group type management with icon picker (~120 Material Symbols)
- Visibility controls per group (when Party module enabled)
- Filter group list by type

---

## Species

- Customizable species/races catalog per campaign
- Species fields: description, traits, size (Tiny → Gargantuan)
- Optional species types (e.g., Humanoid, Beast, Construct)
- Linked NPCs and characters

---

## Social Graph

- Force-directed graph visualization of NPC relationships
- Chord diagram view as alternative
- List view with all relations
- Filter by status, group type, group membership
- Color-coded edges by friendliness
- Convex hull groups for visual clustering
- Click nodes to navigate to NPC pages

---

## Visibility System (Multiplayer)

The GM controls exactly what players see. Three layers:

1. **Entity-level**: Toggle whether the player sees an NPC / location / quest / group at all
2. **Field-level**: Pick which fields are visible (e.g., name + species but NOT appearance)
3. **Connection-level**: Show/hide specific NPC-group memberships and NPC-location presences

Presets: All, Basic, None. GM Notes are never visible to players.

**Important**: Visibility controls only appear when the Party module is enabled for the campaign (no players = no need for visibility).

---

## Multiplayer & Invitations

- GM invites players by email
- Invited user sees pending invitation banner on campaign list
- Accept invitation → become a campaign member with PLAYER role
- Decline invitation
- GM can cancel pending invitations
- GM can kick players from a campaign
- GM can assign characters to specific players
- Real-time updates: when GM changes data, players see it instantly via WebSocket subscriptions
- Players have read-only access to all entities; cannot create, edit, or delete

---

## Authentication & Profile

- Email + password login
- JWT-based session (7-day expiry, stored in localStorage)
- Profile page: update name, change password
- Language switcher (English / Russian) in profile
- Sign out clears Apollo cache and redirects to login
- Default seed account: `gm@arcaneledger.app` / `user`

---

## Admin Panel

- System role `ADMIN` only — protected on every endpoint
- List all users with search by name or email
- Create new user (with role selection: USER or ADMIN)
- Edit user: name, email, role, password
- Delete user (cannot delete self)
- Self-demotion prevention: admins cannot remove their own admin role

---

## Internationalization

- Two languages: English (default), Russian
- ~600 translation keys across 15 namespaces
- All UI text localized: pages, drawers, widgets, error messages, status pills
- Database content stays in original language (campaign-specific names, descriptions)
- Locale-aware date formatting (Mo/Tu/We vs Пн/Вт/Ср)
- Bilingual changelog entries
- URL-based language for SEO on public pages: `/en`, `/ru`, `/en/changelog`, `/ru/login`
- Language switcher on landing page (with flag icons)
- Protected pages don't expose language in URL (already behind auth)

---

## UI System

- Dark fantasy aesthetic — gold (`#f2ca50`) primary, teal secondary, violet tertiary
- Typography: Noto Serif (headlines), Inter (body), uppercase font-label for overlines
- Card-panel layout pattern across all pages
- Custom components instead of native HTML where possible:
  - `Select` instead of `<select>`
  - `DatePicker` instead of `<input type="date">`
  - `InlineRichField` for editable rich text
  - `LocationIcon` for location type icons
  - Inline confirm (Yes/No) instead of browser `confirm()`
- Responsive: works on mobile and desktop, sidebar auto-collapses on narrow screens
- Loading indicator: pill at top-center of content area when GraphQL requests are in flight
- Error toasts: bottom-center for mutation failures, with translated messages
- Friendly "Not Found" pages for missing entities (instead of raw error text)
- Connection-lost overlay if backend becomes unreachable

---

## Dice Roller

- Built-in d4, d6, d8, d10, d12, d20, d100
- Multi-dice rolls with modifiers
- Roll history per session
- Critical hit / fail detection
- Always accessible from sidebar

---

## Changelog

- In-app changelog drawer accessible from sidebar (with "what's new" red dot indicator)
- Bilingual entries (EN + RU)
- Public changelog page accessible without login
- Tagged: New, Updated, Fixed
- Auto-detects unread versions based on localStorage

---

## Real-Time Sync

- WebSocket subscriptions per campaign
- When the GM (or any user) modifies data, all connected clients refetch affected queries
- Includes: NPCs, Locations, Sessions, Quests, Groups, Characters, Visibility changes, Member invitations
- Subscription auth via JWT in connection params

---

## Image Upload

- REST endpoint: `POST /api/upload`
- Stored on disk: `uploads/campaign/{id}/{entity}/{uuid}.ext`
- Served statically via `/uploads/...`
- Used for: NPC portraits, character images, location maps
- 10MB size limit
- Cache-busting on replace

---

## Public Pages (no auth required)

- Landing page (`/en`, `/ru`) — features, roadmap, contact
- Changelog page (`/en/changelog`, `/ru/changelog`)
- Login page (`/en/login`, `/ru/login`)
