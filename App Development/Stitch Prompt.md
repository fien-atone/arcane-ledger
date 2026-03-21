# Google Stitch — Prompt для TTRPG Companion

> Используй этот текст как промпт в Google Stitch.
> Можно разбить на несколько итераций: сначала цветовая схема и общий layout, потом отдельные экраны.

---

## Промпт (англ.)

Design a **web application** for tabletop RPG (TTRPG) campaign management. The app is used during and between game sessions by two types of users: **Game Master (GM)** and **Players**. Desktop/laptop is the primary platform.

---

### Product feel

Dark, atmospheric, but **clean and functional** — not cluttered or gothic. Think Notion meets fantasy worldbuilding. The UI should feel like a **premium tool**, not a game itself. Avoid excessive ornamentation. Typography-first. Subtle dark background (near-black or very dark gray), with a warm accent color (amber, copper, or aged gold tones work well). Secondary accent can be a muted teal or slate blue. Readable at a glance — the GM is often mid-session and needs information fast.

---

### Layout

- **Left sidebar** (collapsible) for campaign navigation
- **Main content area** (fluid width)
- Sidebar items: Dashboard, NPCs, Locations, Factions, Quests, Sessions, Party, Materials
- Top bar: campaign name, global search, dice roller button, user avatar

---

### Key screens to design

#### 1. Campaign Dashboard
The home screen of a campaign. Two columns:
- Left/main: Last session card (title, date, 2–3 line summary, "unresolved threads" note), Active quests list (name + status badge), Next session date
- Right/secondary: Party roster (character portraits in a row — name, species, class), Quick navigation shortcuts (NPCs / Locations / Factions as icon tiles)
- GM only: Quick action buttons (Add NPC, Add Session, Add Quest), Party management link

#### 2. NPC Detail Card
Full-width content card with:
- Header: name, aliases (shown as small tags), status badge (Alive / Dead / Missing / Unknown / Hostile — color-coded), species
- Portrait image placeholder (left, card-style)
- Sections: Appearance, Description, Faction memberships (with role), Last known location, Where to find (list of locations)
- Sessions where this NPC appeared (compact list at bottom)
- GM edit button (top right)

#### 3. Session Detail
- Header: Session number + date, title
- Main content: Summary (markdown rendered), Unresolved threads (nextSessionNotes) — GM only, highlighted box
- Linked entities: NPCs / Locations / Quests that appeared — shown as compact chips/tags
- Personal notes section (SessionNote) — visible only to the author, private textarea at the bottom

#### 4. Locations List
- Tree/hierarchy view: Region → Settlement → District → Building
- Each row: location type icon, name, subtype badge
- Collapsible tree nodes

#### 5. Dice Roller (overlay / modal)
- Clean dark modal
- Dice buttons: d4, d6, d8, d10, d12, d20, d100
- Modifier input (+/-)
- 3D dice animation area (center)
- Result display (large number)
- Toggle: Public / Private roll

---

### Visual language

- **Color scheme**: Dark background (#0f0f14 or similar), warm amber/gold accent (#c9a84c or similar), muted text (#8b8fa8), card surfaces slightly lighter than background (#1a1a24)
- **Typography**: Clean sans-serif for UI (Inter or similar), possibly a slightly more characterful display font for headings (nothing too ornate)
- **Cards**: Subtle border (1px), slight inner glow or shadow, no heavy drop shadows
- **Badges/status**: Color-coded pills — avoid red entirely (red feels like D&D branding). Use instead: sage green (alive/active), deep violet or dark purple (dead/hostile), muted amber (unknown/missing), slate gray (inactive)
- **Icons**: Thin line icons, consistent set (Lucide or similar)
- **Spacing**: Generous. This is a reading/reference tool, not a dashboard with 40 widgets.

---

### What NOT to do

- No parchment textures or fake aged paper
- No excessive fantasy fonts (no blackletter)
- No light theme — this is a dark app
- No mobile-first layout — desktop is primary
- No heavy gradients or glowing effects everywhere
- Don't make it look like a game HUD
- **No red tones anywhere** — not in accents, not in badges, not in alerts. Red reads as D&D branding and should be completely absent from the palette.

---

## Итерации (рекомендуемый порядок)

1. ✅ **Сначала**: попроси Stitch сгенерировать цветовую схему и общий layout — sidebar + topbar + main content area
2. **Потом**: Campaign Dashboard — GM view и Player view
3. **Потом**: NPC Detail Card
4. **Потом**: Dice Roller modal
5. **Напоследок**: Session Detail и Locations List

---

---

## Промпт #2 — Campaign Dashboard (GM + Player)

Use the same dark color scheme, sidebar, and topbar from the previous design. Now design the **Campaign Dashboard** screen — the home screen of a campaign. Show **two variants side by side or as separate screens**: one for the **Game Master (GM)**, one for the **Player**.

---

### Important corrections from the previous iteration:
- **No HP bars or character stats** — this app does not track hit points or combat stats
- **No in-world calendar** ("Day 142, Winter") — we don't have a fictional calendar system
- **No "active session" framing** — the dashboard is viewed *between* sessions, not during live play
- The hero area should show the **last completed session**, not a currently running session

---

### GM Dashboard layout

Two-column layout (main left ~65%, sidebar right ~35%):

**Left column:**
- **Hero card — Last Session**: large card with session number, title, date, and 2–3 sentence summary. Below the summary: a highlighted "Unresolved threads" box (amber border, slightly different background) — this is the GM's private note about what to address next session. CTA buttons: "View full session" and "Add new session"
- **Active Quests**: compact list — quest name, status badge (Active / Completed / Failed / On Hold), and one-line description. Link "View all quests" at the bottom

**Right column:**
- **Next session**: date and time, prominent. Link "Add to calendar"
- **Party roster**: vertical list of party members — avatar circle, character name, species + class. Not clickable portraits in a row — a clean compact list. Link "Manage party"
- **Quick actions**: three icon buttons — "+ Add NPC", "+ Add Session", "+ Add Quest"

---

### Player Dashboard layout

Same shell (sidebar + topbar). Different content — the player sees less:

**Left column:**
- **Hero card — Last Session**: same session card but WITHOUT the "Unresolved threads" box — that's GM-only. Just session number, title, date, summary. CTA: "View full session" and "My session notes"
- **Active Quests**: same list but only quests visible to players

**Right column:**
- **Next session**: same date/time block
- **My Character**: pinned character card — portrait, character name, species, class, short backstory excerpt. Link "View character"
- No quick action buttons — player cannot add content

---

### Notes
- Status badges on quests: use teal (Active), slate gray (On Hold), muted green (Completed), deep violet (Failed) — no red
- The "Unresolved threads" box is the most important GM-only element — make it visually distinct but not alarming
- The difference between GM and Player views should be immediately obvious at a glance

---

*v0.3 — 20.03.2026*
