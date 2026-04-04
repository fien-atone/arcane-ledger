# Changelog

All notable changes to Arcane Ledger are documented here.

---

## [Unreleased] — 2026-03-29

### File Upload System
- **REST upload endpoint** `POST /api/upload/:campaignId/:entity/:entityId` — multer, JWT auth, GM role check, 5MB limit
- **Local file storage** organized as `uploads/campaign/{campaignId}/{entity}/{uuid}.ext`
- **Static serving** via Express for uploaded files
- **Docker volume** for upload persistence
- **Migration script** `migrate-images.ts` for converting base64 DB images to files
- **Frontend `uploadFile()` helper** + `resolveImageUrl()` for transparent base64/path/URL handling
- **Image removed from GraphQL save mutations** — managed exclusively via REST upload
- **Cache-busting** after image replace (query param `?v=N`)

### Bug Fixes
- **Client-side ID generation removed** from all create drawers (NPC, Quest, Session, Location, Character, Relation) — server UUIDs only
- **Group membership** add/remove uses dedicated `addNPCGroupMembership`/`removeNPCGroupMembership` mutations
- **Location presence** add/remove/note uses dedicated `addNPCLocationPresence`/`removeNPCLocationPresence` mutations on both NPC and Location detail pages
- **Social relations** refetch both `RelationsForEntity` and `RelationsForCampaign` queries; `__typename` excluded from mutation input
- **Save resolvers** (NPC, Location, Character) no longer overwrite `image` field when not provided in input
- **Express body limit** raised to 10MB for GraphQL endpoint
- **Frozen Apollo cache** arrays copied before `.sort()` to prevent read-only errors
- **Location list** description rendered via `RichContent` instead of plain text

### UI Improvements
- **NPC list** — avatar photos shown in list items; card layout with portrait in preview panel
- **NPC detail** — group membership management (add/remove) directly from NPC page
- **Location detail** — image/map moved to right column; map markers displayed on mini-map preview; delete location button added
- **Location map placeholder** uses shared `ImageUpload` component (consistent View/Replace hover UI)
- **EmptyState** component used consistently on all list pages (NPC, Session, Quest, LocationTypes)
- **Image upload removed** from LocationEditDrawer (available on detail page after creation)

---

## 2026-03-23

### Map Viewer
- **Marker editing** — selected marker popup now has an Edit button; allows changing label and location link; click a linked location again to deselect it
- **Marker pin labels** restored for location-linked markers (no duplicate in popup since popup now shows location as a link)
- **Auto-save** on every marker action: add, quickLink place, Add Location from map (Enter and button), delete
- **Location dropdown** in Add Marker popup replaced with styled list; already-linked locations filtered out
- **Sidebar header** — Locations shows `X of Y` (placed / total) right-aligned; Markers section shows count right-aligned
- **Sidebar sort** — locations with markers sorted by marker order number
- **Hover effects** on map pins and sidebar rows made more prominent (stronger glow, scale, color transitions)
- **Counter X/Y** — total Y highlighted in primary color, placed X in muted

### Location Detail Page
- **NPC presence notes** — inline note editing per NPC per location (click to edit, Enter/Escape to save/cancel)
- **Add NPC to location** — picker with search, adds via `locationPresences`
- **Remove NPC from location** — inline confirm (Remove? Yes / No)
- **Add child location** from location detail page and from map viewer
- **NPC and location lists** sorted alphabetically

### Location List Page
- Removed stats block from header
- Filter pills show inline count

### Location Edit Drawer
- Settlement type auto-fills population with type default; replaces if previous value matched the old default

### Species Page
- Full CRUD — create, edit, delete species
- Split-pane layout: list left, detail right

---

## [0.1.0] — 2026-03-20

### Initial release
- Vite + React 19 + TypeScript, FSD architecture
- Campaigns, NPCs, Locations, Sessions, Groups, Characters, Species, Relations entities
- `localStorage`-backed repositories with mock data
- Sidebar navigation, Dice Roller modal
- Map Viewer with pan/zoom, percentage-based markers, drag-to-reposition
