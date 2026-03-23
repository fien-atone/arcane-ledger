# Changelog

All notable changes to Arcane Ledger are documented here.

---

## [Unreleased] — 2026-03-23

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
