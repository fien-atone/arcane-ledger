# Arcane Ledger — Claude Guide

TTRPG campaign management app. GM-first, local-only (no backend). Dark fantasy aesthetic.

---

## Stack

| Tool | Version | Notes |
|---|---|---|
| React | 19 | |
| TypeScript | 5.9 | strict mode |
| Vite | 8 | |
| Tailwind CSS | v4 | `@theme` in `index.css`, no `tailwind.config.js` |
| TanStack Query | 5 | all async state |
| React Router | 7 | |
| TipTap | 3 | `BubbleMenu` from `@tiptap/react/menus`, NOT `@tiptap/react` |
| `@tailwindcss/typography` | 0.5 | prose classes |

---

## Architecture — Feature-Sliced Design (FSD)

```
src/
  app/          — router, providers, layout
  pages/        — one file per route (fat, composed from features + shared)
  widgets/      — Sidebar, Topbar, DiceRoller, ChangelogDrawer
  features/     — domain slices: characters, npcs, locations, groups,
                  groupTypes, locationTypes, species, relations,
                  sessions, quests, campaigns, factions, auth
  shared/
    ui/         — reusable presentational components (see below)
    api/
      repositories/   — all data access (mock+localStorage pattern)
      mockData/       — seed data per entity
    changelog/  — CHANGELOG entries array
  entities/     — TypeScript types per domain
```

Imports use `@/` alias pointing to `src/`.

---

## Data Layer

All data is **localStorage-backed mock**. No real backend exists.

Every repository follows this pattern:

```ts
const STORAGE_KEY = 'ttrpg_<entity>';
const STORAGE_VERSION = '1';

function load(): Entity[] { /* merge seed + user-created on version mismatch */ }
function persist(items: Entity[]): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

export const fooRepository = {
  list: async () => { await delay(300); return load(); },
  getById: async (id) => { ... },
  save: async (item) => { /* upsert */ persist(...); return item; },
  delete: async (id) => { persist(load().filter(x => x.id !== id)); },
};
```

`VITE_USE_MOCK !== 'false'` gates mock vs real API. Always use mock path for now.

All queries/mutations live in `features/<domain>/api/queries.ts` using TanStack Query.
Mutations call `queryClient.invalidateQueries` on success to refresh caches.

---

## Shared UI Components

Import from `@/shared/ui`. All exported from `shared/ui/index.ts`.

| Component | Props | Use for |
|---|---|---|
| `BackLink` | `to`, `children` | Back-navigation breadcrumb with `chevron_left` |
| `GmNotesSection` | `notes?`, `fallback?`, `variant?='card'\|'sidebar'` | GM notes block |
| `SectionLabel` | `children`, `color?='primary'\|'muted'`, `className?` | `text-[10px]` overline label |
| `LoadingSpinner` | `as?='main'\|'div'`, `text?` | Loading state |
| `Select<T>` | `value`, `options`, `onChange`, `placeholder?`, `nullable?` | Custom dropdown (dark-theme safe, avoids native `<select>`) |
| `ImageUpload` | `value`, `onChange`, `onView?` | Portrait/image upload with lightbox support |
| `D20Icon` | `className?` | SVG d20 die icon |
| `Footer` | — | Public page footer |
| `LocationIcon` | `locationType`, `size?`, `className?` | Location type icon with category colour (inline style, cascade-proof) |
| `DatePicker` | `value` (YYYY-MM-DD), `onChange`, `placeholder?` | Custom dark-theme calendar picker with month nav, weekend highlighting |
| `InlineRichField` | `label`, `value`, `onSave`, `placeholder?`, `isGmNotes?` | Inline-editable TipTap field (click to edit, blur/buttons to save) |
| `RichTextEditor` | `value`, `onChange`, `placeholder?`, `minHeight?` | TipTap editor with always-visible toolbar |
| `RichContent` | `value`, `className?` | Read-only TipTap HTML renderer with prose styling |

**Never use native `<select>`** — use `Select` from shared/ui.
**Never use native `<input type="date">`** — use `DatePicker` from shared/ui.
**Never render location type icons inline** — use `LocationIcon` which auto-resolves icon + category colour.

---

## Design System

### Colors (Tailwind classes)
- Background / surface hierarchy: `bg-background`, `bg-surface`, `bg-surface-container-low`, `bg-surface-container`, `bg-surface-container-high`, `bg-surface-container-highest`
- Accent: `text-primary` / `bg-primary` = aged gold (`#f2ca50`)
- Secondary: teal (`#7bd6d1`)
- Tertiary: violet (`#d0c8ff`)
- Text: `text-on-surface`, `text-on-surface-variant`
- Borders: `border-outline-variant/10`, `/20`, `/25`, `/30`

### Typography
- Headlines / titles: `font-headline` (Noto Serif, italic for brand name)
- Body: `font-sans` (Inter)
- Labels / badges / buttons: `font-label text-[10px] uppercase tracking-widest`

### Shape
Sharp, precision aesthetic. `rounded-sm` everywhere (0.125rem). No large radii except `rounded-full` for pills/dots.

### Buttons
Primary action (gradient):
```tsx
className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary text-xs font-label uppercase tracking-widest rounded-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
```

Ghost / outline action:
```tsx
className="flex items-center gap-2 px-6 py-2.5 border border-outline-variant/30 text-primary hover:border-primary/50 text-xs font-label uppercase tracking-widest rounded-sm transition-colors"
```

### Form Inputs (in drawers)
```tsx
const inputCls = 'w-full bg-surface-container-low border border-outline-variant/25 hover:border-outline-variant/50 focus:border-primary rounded-sm py-2.5 px-3 text-on-surface text-sm focus:ring-0 focus:outline-none transition-colors placeholder:text-on-surface-variant/30';
const labelCls = 'block text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1.5';
```

### Z-index
Tailwind v4 default goes up to `z-50`. Extended in `index.css @theme`:
- `z-60` — drawer backdrop
- `z-70` — drawer panel
- Dice roller FAB uses `z-50` → drawers are always on top at z-60/z-70

---

## Drawer Pattern

All edit/create drawers follow the same structure:
- Backdrop: `fixed inset-0 z-60 bg-black/50 backdrop-blur-sm` — closes on click
- Panel: `fixed inset-y-0 right-0 z-70 w-full max-w-lg flex flex-col bg-surface shadow-2xl border-l border-outline-variant/20`
- Header: title + subtitle + close `×` button
- Body: `flex-1 overflow-y-auto px-8 py-6 space-y-5`
- Footer: `flex items-center justify-end gap-3 px-8 py-5 border-t border-outline-variant/10 flex-shrink-0 bg-surface-container-lowest` with Cancel + Save buttons

Drawers support both **create** and **edit** mode via optional entity prop:
```ts
const isNew = !entity;
// state resets to empty on open when isNew, prefills when editing
// handleSave generates ID: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`
```

---

## Icons

Material Symbols Outlined (variable font loaded via CSS). Use as:
```tsx
<span className="material-symbols-outlined">icon_name</span>
// Filled variant:
<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>icon_name</span>
```

For d20 use `<D20Icon />` from shared/ui — never the `casino` Material Symbol.

---

## TipTap (Rich Text)

Used across all detail pages via `InlineRichField` (inline edit) and `RichTextEditor` (drawer forms).

```ts
import { BubbleMenu } from '@tiptap/react/menus'; // NOT from '@tiptap/react'
// tippyOptions prop does not exist in v3 — do not use it
// setContent second arg must be SetContentOptions object, NOT boolean:
editor.commands.setContent(html, { emitUpdate: false }); // correct
```

Prose container classes:
```
prose prose-sm prose-invert font-sans max-w-none
prose-headings:font-headline prose-headings:text-on-surface
prose-p:text-on-surface-variant prose-p:leading-relaxed
```

---

## Routing

Public routes: `/`, `/login`, `/changelog`
Protected routes (require auth): `/campaigns`, `/campaigns/:campaignId/*`

Auth is mock — `user/user` logs in as GM. Stored in `sessionStorage`.

---

## Versioning

Version is derived automatically from `CHANGELOG[0].version` in `src/shared/changelog/entries.ts`.
Landing page reads it at build time — **never hardcode version strings**.

When adding features, add a new entry at the top of the array with the bumped version.
Public changelog page: `/changelog`.
In-app changelog: drawer accessible from the sidebar.

---

## Conventions

- **No backend calls** — everything goes through `*Repository` → localStorage
- **No native `<select>`** — always use `Select` from shared/ui
- **No native `<input type="date">`** — always use `DatePicker` from shared/ui
- **No inline location icons** — always use `LocationIcon` from shared/ui
- **Drawer z-index**: backdrop `z-60`, panel `z-70`
- **IDs**: generated as `` `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}` ``
- **Timestamps**: `new Date().toISOString()` for `createdAt` / `updatedAt`
- **Required string fields** (like `gmNotes: string`): always default to `''` in create mode, never `undefined`
- **Images**: stored as base64 data URLs in localStorage via `ImageUpload`
- **prose + TipTap**: always add `font-sans` to prevent serif bleed-through
- **Empty states**: inline `<p className="text-xs text-on-surface-variant/40 italic p-6">No X found.</p>`
- **Loading states**: `<LoadingSpinner as="main" />` for page-level, `<LoadingSpinner />` for inline
- **Destructive actions**: always inline confirm (Yes/No) — **never use browser `confirm()`**
- **Location type colours**: use `CATEGORY_HEX_COLOR` with inline `style={{ color }}` — Tailwind classes get overridden by parent hover cascade in v4
- **Defensive fallbacks**: always `(entity.arrayField ?? [])` for optional arrays from localStorage (old data may lack the field)
