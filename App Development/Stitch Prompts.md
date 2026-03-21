# Stitch Prompts — TTRPG Companion

Промпты для Google Stitch. Копируй по одному, в порядке нумерации.
Каждый следующий промпт опирается на результат предыдущего.

---

## Prompt 1 — Shell: color scheme + layout

Design the **visual identity and shell layout** for a dark web application called **TTRPG Companion** — a campaign management tool for tabletop RPG game masters and players.

**Color palette requirements:**
- Very dark background (near-black, slightly warm or cool — not pure #000)
- Primary accent: amber or aged gold (warm, not yellow)
- Secondary accent: muted teal or slate blue
- Status colors must avoid red entirely — use deep violet, sage green, muted amber, and slate gray instead
- Muted body text, slightly brighter headings
- Card surfaces: slightly lighter than the background, with a subtle 1px border

**Shell layout:**
- Fixed **left sidebar** (collapsible) — dark, slightly lighter than background, with icon + label nav items: Dashboard, NPCs, Locations, Factions, Quests, Sessions, Party, Materials
- **Top bar** — campaign name on the left, global search in the center, dice roller icon button + user avatar on the right
- **Main content area** — fluid width, generous padding, scrollable

**Mood:** Notion meets fantasy worldbuilding. Premium tool, not a game. No parchment, no HUD, no blackletter fonts, no red. Clean and readable — the GM uses this mid-session and needs information fast.

---

## Prompt 2 — Campaign Dashboard (GM + Player)

Use the same dark color scheme, sidebar, and topbar from the previous design. Now design the **Campaign Dashboard** screen — the home screen of a campaign. Show **two variants side by side or as separate screens**: one for the **Game Master (GM)**, one for the **Player**.

**Important corrections:**
- No HP bars or character stats — this app does not track hit points or combat stats
- No in-world calendar ("Day 142, Winter") — we don't have a fictional calendar system
- No "active session" framing — the dashboard is viewed *between* sessions, not during live play
- The hero area should show the **last completed session**, not a currently running session

**GM Dashboard — two-column layout (left ~65%, right ~35%):**

Left column:
- Hero card — Last Session: session number, title, date, 2–3 sentence summary. Below summary: "Unresolved threads" box (amber border, slightly different background) — GM's private note. CTA: "View full session" + "Add new session"
- Active Quests: compact list — quest name, status badge, one-line description. "View all quests" link at bottom

Right column:
- Next session: date and time, prominent. "Add to calendar" link
- Party: vertical list — avatar circle, character name, species + class. "Manage party" link
- Quick actions: three icon buttons — "+ Add NPC", "+ Add Session", "+ Add Quest"

**Player Dashboard — same shell, different content:**

Left column:
- Hero card — Last Session: same card but WITHOUT the unresolved threads box. CTA: "View full session" only
- Active Quests: same list, only quests visible to players

Right column:
- Next session: same date/time block
- My Character: portrait, character name, species, class, short backstory excerpt. No stats, no "View Character Sheet" link
- Party: same list as GM, placed below the character card

**Notes:**
- Quest status badges: teal (Active), slate gray (On Hold), muted green (Completed), deep violet (Failed) — no red
- Unresolved threads box is the key GM-only element — visually distinct but not alarming
- No top horizontal navigation bar — sidebar only
- Sidebar is identical in both views and must be collapsible
- No "Support" item in sidebar

---

## Prompt 3 — Landing + Login

Use the same dark color scheme from the previous screens. Design two simple screens: **Landing page** and **Login page**.

**Landing page (`/`):**
Full-width public page. Single centered column.
- Large headline: product name + tagline (something like "Your campaign. Remembered.")
- 2–3 line description: what it is and who it's for (Game Masters and Players)
- One large atmospheric illustration or screenshot placeholder showing the app interface
- Single CTA button: "Sign In" — amber, prominent
- Minimal footer

Mood: atmospheric, confident, not over-designed. A GM stumbles on this link and immediately gets it.

**Login page (`/login`):**
Centered card on dark background.
- Product name/logo at top
- Email field + Password field
- "Sign In" button — primary amber
- Small note: "Don't have an account? Contact your Game Master." — no public registration
- Link back to landing page

No social login, no "Forgot password" for now.

---

## Prompt 4 — My Campaigns

Use the same dark color scheme and shell from the previous screens. Design the **My Campaigns** screen (`/campaigns`) — the user's entry point after login.

This screen is different depending on the user's role. Show two variants:

**GM variant:**
- Section header: "My Campaigns"
- Grid of campaign cards (2–3 columns): campaign name, cover image placeholder, number of sessions, number of players, status badge (Active / Archived)
- "+ Create Campaign" button — prominent, top right

**Player variant:**
- Section header: "My Campaigns"
- Grid of campaign cards: campaign name, cover image placeholder, my character name + class, next session date
- No "Create Campaign" button
- Small "Join Campaign" link (for accepting an invite) — subtle, not a primary CTA

**Notes:**
- No sidebar campaign nav here — this is above the campaign level. Keep the top bar, but the sidebar should be minimal or absent
- Cards should feel like "portals into a world" — atmospheric image placeholder, not just text rows
- Archived campaigns appear muted/desaturated

---

## Prompt 5 — NPC List

Use the same dark color scheme and collapsible left sidebar. Design the **NPC List** screen (`/campaigns/:id/npcs`).

**Layout:** Full-width content area with a toolbar at top and a list/table below.

**Toolbar:**
- Search input: "Search by name or alias..."
- Filter pills: All / Alive / Dead / Missing / Unknown / Hostile
- Filter by faction (dropdown)
- "+ Add NPC" button — GM only, top right

**List:**
Each NPC row contains:
- Portrait thumbnail (small circle, 36px)
- Name (bold) + aliases in muted text below
- Status badge (color-coded pill)
- Species
- Primary faction (or "—" if none)
- Last known location

Clicking a row opens the NPC Detail screen.

**Notes:**
- Status badge colors: sage green (Alive), deep violet (Dead), slate gray (Missing/Unknown), dark amber (Hostile) — no red
- Empty state: "No NPCs yet. Add your first NPC." with a button
- Player sees the same list for now (visibility filtering is a future feature)

---

## Prompt 6 — NPC Detail

Use the same dark color scheme and collapsible left sidebar. Design the **NPC Detail** screen (`/campaigns/:id/npcs/:id`).

**Layout:** Two columns (left ~65%, right ~35%).

**Left column:**
- Header: NPC name (large), aliases as small muted tags below. Status badge + species next to the name
- Portrait: large image card, left-aligned, header info to its right. Silhouette placeholder if no image
- Appearance: short physical description text section
- Description / Background: longer text, markdown rendered
- Faction memberships: compact list — faction name + role (e.g. "The Iron Circle — Enforcer"). Each as a link chip
- Sessions appeared in: compact list at bottom — session number, title, date. Muted secondary style

**Right column:**
- Edit button at top — GM only
- Last known location: location name with pin icon, linked
- Where to find: list of locations where NPC is typically encountered — name + type badge (Settlement, Dungeon, etc.)
- GM Notes block (GM only): visually separated with subtle amber left border, labeled "GM Notes". Private freeform text field

**Notes:**
- Status badge colors: sage green (Alive), deep violet (Dead), slate gray (Missing/Unknown), dark amber (Hostile) — no red
- GM Notes should feel private but not alarming — subtle distinction
- Players see this screen without the GM Notes block and without the Edit button
- Faction chips and location links look like interactive tags

---

## Prompt 7 — Session List + Session Detail

Use the same dark color scheme and collapsible left sidebar. Design two screens: **Session List** and **Session Detail**.

**Session List (`/campaigns/:id/sessions`):**
- Reverse chronological list (newest first)
- Each row: session number, title (auto-generated: "Session 01 — 02.09.2025"), date, optional one-line brief in muted text
- "+ New Session" button — GM only, top right
- Clean timeline feel — sessions are history entries, not tasks

**Session Detail (`/campaigns/:id/sessions/:id`):**
Two-column layout (left ~65%, right ~35%):

Left column:
- Header: session number, title, date + time
- Summary: long markdown-rendered text block
- Unresolved threads / Next session notes: highlighted box (amber border) — GM only, not visible to players
- My Notes: private textarea at the bottom, labeled "My notes (only visible to you)". Shown to both GM and players, each sees only their own

Right column:
- Edit button — GM only
- NPCs in this session: compact chips with name + status badge
- Locations in this session: compact chips
- Quests mentioned: compact chips with status badge

**Notes:**
- The "My Notes" section is the same component for GM and Player — just personal, private
- Players see the same layout but without the Unresolved threads box and without the Edit button

---

## Prompt 8 — Party + PC Detail

Use the same dark color scheme and collapsible left sidebar. Design two screens: **Party** and **PC Detail**.

**Party (`/campaigns/:id/party`):**
- Grid of character cards (2–3 columns)
- Each card: portrait image, character name, species + class, player name (muted, below)
- GM only: small "GM notes" icon indicator on cards that have notes
- Placeholder card for players without a character: player name, "No character yet" label, muted style
- "+ Add Character" button — GM only
- No stats, no HP, no inventory

**PC Detail (`/campaigns/:id/characters/:id`):**
Two-column layout (left ~65%, right ~35%):

Left column:
- Portrait: large image
- Name, species, class
- Backstory / background: long text, markdown rendered
- Appearance: text section

Right column:
- Edit button — GM only
- GM Notes (gmNotes): subtle amber-bordered block, labeled "GM Notes" — GM only
- Personal Quests: compact list of quests linked to this character — GM only. These are secret personal storylines

**Notes:**
- No character stats (STR/DEX/etc.) — this is a narrative tool, not a character sheet
- Players can view their own character but cannot edit it
- Personal quests are completely hidden from players

---

## Prompt 9 — Location List + Location Detail

Use the same dark color scheme and collapsible left sidebar. Design two screens: **Location List** and **Location Detail**.

**Location List (`/campaigns/:id/locations`):**
- Tree/hierarchy view: Region → Settlement → District → Building
- Each row: type icon, location name, subtype badge (e.g. "Capital City", "Tavern", "Dungeon")
- Collapsible tree nodes with expand/collapse toggle
- Filter by type (dropdown)
- "+ Add Location" button — GM only

**Location Detail (`/campaigns/:id/locations/:id`):**
Two-column layout (left ~65%, right ~35%):

Left column:
- Name, type badge, subtype
- Breadcrumb navigation showing parent hierarchy (e.g. "Eldar Kingdom → Oakhaven → Market District")
- Image / map placeholder
- Description: markdown text
- Child locations: compact list of sub-locations within this one
- Connected locations (exits/transitions): compact list — "North Road → Whispering Woods"

Right column:
- Edit button — GM only
- NPCs spotted here: compact list with portrait + name + status badge

**Notes:**
- The tree view is the most important part of the list screen — make it feel like a real map hierarchy
- Breadcrumbs on the detail screen help orient within the world

---

## Prompt 10 — Faction Detail + Quest Detail

Use the same dark color scheme and collapsible left sidebar. Design two detail screens: **Faction Detail** and **Quest Detail**. These are content cards similar to NPC Detail.

**Faction Detail (`/campaigns/:id/factions/:id`):**
Two-column layout:

Left column:
- Name (large), aliases as muted tags
- Symbol/emblem image placeholder
- Description: what this faction is, their goals, ideology
- Relationship to party: badge — Friendly / Neutral / Hostile / Unknown (no red for Hostile — use dark amber)

Right column:
- Edit button — GM only
- Members: list of NPCs with their role in the faction (e.g. "Malakor the Gray — Leader"). Each NPC is a link chip with status badge

**Quest Detail (`/campaigns/:id/quests/:id`):**
Two-column layout:

Left column:
- Quest name (large), status badge (Active / Completed / Failed / On Hold)
- Description: full quest text, markdown rendered
- Progress notes: ongoing GM notes about quest progress

Right column:
- Edit button — GM only
- Quest giver: NPC chip with name and status
- Reward: text field
- Characters involved: compact list of PCs linked to this quest (for personal quests — GM only)

**Notes:**
- Quest status badge colors: teal (Active), muted green (Completed), deep violet (Failed), slate gray (On Hold) — no red
- Faction relationship badge: sage green (Friendly), slate (Neutral), dark amber (Hostile), muted gray (Unknown)

---

## Prompt 11 — Materials

Use the same dark color scheme and collapsible left sidebar. Design the **Materials** screen (`/campaigns/:id/materials`) — the campaign's reference library.

**Layout:** Two-panel layout — left panel is a list/tree of materials, right panel shows the selected item.

**Left panel (list, ~35% width):**
- Filter tabs at top: All / Pages / Links / Files
- List of materials: type icon + title
  - Page (📄): wiki-style article
  - Link (🔗): external URL
  - File (📎): uploaded file (PDF, image, etc.)
- "+ Add Material" button — GM only (with dropdown to choose type)
- Search input

**Right panel (content, ~65% width):**
- If a **Page** is selected: rendered markdown content, full wiki article. Edit button for GM.
- If a **Link** is selected: title, URL shown as a clickable link, short description. "Open link" button.
- If a **File** is selected: file name, file type badge, upload date. "Download / View" button. Preview for images.
- Empty state (nothing selected): "Select a material from the list"

**Notes:**
- This is a reference library accessible to everyone in the campaign — rulebooks, maps, lore pages, external links
- GMs can add/edit, players can only view
- The two-panel layout is like a file browser + preview — familiar pattern

---

## Prompt 12 — Dice Roller (modal)

Use the same dark color scheme and shell from the previous screens. Design the **Dice Roller** — a modal overlay that appears on top of any screen when the user clicks "Roll Dice" in the top bar.

Centered modal, medium width (~520px), dark background slightly lighter than the main background. Subtle border.

**Top section — dice selection:**
A row of dice buttons: d4, d6, d8, d10, d12, d20, d100. Each is a compact button with the die label. Selected die is highlighted with amber. Multiple dice can be selected (e.g. 2d6).

**Quantity + modifier row:**
Number input for quantity (default 1) + modifier input (positive or negative integer, default 0). Example label: "2d6 + 3"

**Center — animation area:**
Large empty space for the 3D dice animation. At rest: stylized single die icon. After rolling: animated result.

**Result display:**
Total result in large bold amber number. Below in muted text: individual rolls breakdown (e.g. "4 + 5 = 9, +3 modifier").

**Bottom row:**
- Left: "Public / Private" pill toggle — teal = public, slate = private. Private has a subtle eye-slash icon
- Center: large "ROLL" button — primary amber CTA, most prominent element
- Right: "History" link — muted, opens roll log

**Notes:**
- Clean and focused — a moment of tension, not a form
- No red anywhere
- The ROLL button dominates the screen

---

*Файл обновляется по ходу проектирования.*
