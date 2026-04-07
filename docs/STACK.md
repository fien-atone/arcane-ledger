# Tech Stack — Arcane Ledger

**Last updated**: 2026-04-07

This is the source of truth for the project's technology stack. Always check this before writing code that depends on framework APIs — major versions break.

---

## Languages & Runtime

| Layer | Tech | Version |
|---|---|---|
| Frontend language | TypeScript | 5.9 (strict mode) |
| Backend language | TypeScript | 5.9 (strict mode) |
| Runtime | Node.js | 22 |
| Module system | ESM (`"type": "module"`) | — |
| Package manager | npm | bundled |

---

## Frontend

### Core
| Tech | Version | Notes |
|---|---|---|
| **React** | **19.2** | Concurrent rendering, new use() hook available |
| **Vite** | 8 | Build tool — uses Rolldown internally |
| **React Router** | **7.13** | NOT v6 — `createBrowserRouter`, `useParams`, `Outlet` patterns |
| **TypeScript** | 5.9 strict | `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` |

### Data layer
| Tech | Version | Notes |
|---|---|---|
| **Apollo Client** | **4.1** | NOT v3! Uses `ErrorLink` class (not `onError`) and `CombinedGraphQLErrors.is()` for error detection |
| **graphql** | 16.13 | core GraphQL JS lib |
| **graphql-ws** | 6.0 | WebSocket subscriptions client |

### UI & styling
| Tech | Version | Notes |
|---|---|---|
| **Tailwind CSS** | **4.2** | NOT v3! Uses `@theme` block in CSS, no `tailwind.config.js`, `@tailwindcss/vite` plugin |
| **TipTap** | **3.20** | Rich text editor — NOT v2! `BubbleMenu` is from `@tiptap/react/menus` |
| **Material Symbols** | latest | Icon set, no React lib — used as CSS font with `material-symbols-outlined` class |
| **DOMPurify** | 3.3 | XSS sanitization for `dangerouslySetInnerHTML` |

### State management
| Tech | Version | Notes |
|---|---|---|
| **Zustand** | 5.0 | Used for: auth, campaigns UI, toasts, loading indicator |

### i18n
| Tech | Version | Notes |
|---|---|---|
| **i18next** | 26.0 | Core i18n |
| **react-i18next** | 17.0 | React bindings — `useTranslation('namespace')` pattern |
| **i18next-browser-languagedetector** | 8.2 | Reads `arcane_ledger_lang` from localStorage |

### Visualization
| Tech | Version | Notes |
|---|---|---|
| **D3** | 3.x | force, selection, shape, transition, zoom — used by social graph |

### Frontend dev tools
| Tech | Version |
|---|---|
| Playwright | 1.59 (E2E tests, Chromium only) |
| ESLint | 9.39 |

---

## Backend

### Core
| Tech | Version | Notes |
|---|---|---|
| **Apollo Server** | **4.11** | Express middleware integration via `@apollo/server/express4` |
| **Express** | 4.21 | HTTP server, static files, upload endpoint |
| **Prisma ORM** | **6.4** (client + cli) | NOT v5! Schema in `prisma/schema.prisma` is source of truth |
| **PostgreSQL** | 17 | via Docker Compose (postgres:17-alpine) |

### GraphQL
| Tech | Version |
|---|---|
| **graphql** | 16.9 |
| **@graphql-tools/schema** | 10.0 |
| **graphql-subscriptions** | 3.0 |
| **graphql-ws** | 5.16 |
| **ws** | 8.18 (WebSocket server) |

### Auth & security
| Tech | Version | Notes |
|---|---|---|
| **jsonwebtoken** | 9.0 | JWT (HS256, 7-day expiry, secret from `JWT_SECRET` env — fails startup if missing) |
| **bcryptjs** | 2.4 | Password hashing (10 rounds) |
| **cors** | 2.8 | CORS — restricted to `localhost:5173`, `localhost:3000` in dev (configurable via `CORS_ORIGINS`) |

### File handling
| Tech | Version | Notes |
|---|---|---|
| **multer** | 2.1 | File upload handling (REST endpoint at `/api/upload`) |

### Performance
| Tech | Version | Notes |
|---|---|---|
| **dataloader** | 2.2 | Per-request batching to prevent N+1 queries |

### Backend dev tools
| Tech | Version | Notes |
|---|---|---|
| **Vitest** | 4.1 | Test runner |
| **supertest** | 7.2 | HTTP testing for Apollo |
| **tsx** | 4.19 | TypeScript execution + watch mode |
| **typescript** | 5.9 |

---

## Database

| Detail | Value |
|---|---|
| **Engine** | PostgreSQL 17 |
| **ORM** | Prisma 6.4 |
| **Migration tool** | Prisma Migrate |
| **Connection** | `DATABASE_URL` env var |
| **Production DB** | `arcane_ledger` |
| **Test DB** | `arcane_ledger_test` (auto-used by `npm test`, refuses to run against any DB without `_test` in name) |

---

## Infrastructure

| Tool | Version | Purpose |
|---|---|---|
| **Docker** | latest | Postgres container, optional backend/frontend containers |
| **docker-compose** | v2 | Local orchestration; reads secrets from `.env` (no hardcoded credentials) |
| **GitHub Pages** | — | Frontend deployment target (basename `/arcane-ledger`) |

---

## Key API Version Gotchas

These are the patterns most likely to break if you assume the wrong version:

### Apollo Client v4 (NOT v3)
```ts
// ❌ v3 — does not work in v4
import { onError } from '@apollo/client/link/error';
const link = onError(({ graphQLErrors, networkError }) => { ... });

// ✅ v4
import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client';
const link = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    for (const err of error.errors) { ... }
  }
});
```

### Tailwind CSS v4 (NOT v3)
- Theme defined inline in CSS via `@theme { ... }`, NOT in `tailwind.config.js`
- Use `@tailwindcss/vite` plugin, not PostCSS
- Custom colors/fonts directly in `index.css`

### React Router v7 (NOT v6)
- `createBrowserRouter` API
- Layout routes via `element` prop without explicit `path`
- `useNavigate`, `useParams`, `Outlet` work the same as v6

### TipTap v3 (NOT v2)
- `BubbleMenu` from `@tiptap/react/menus`, NOT `@tiptap/extension-bubble-menu`
- `useEditor` API is the same

### Prisma v6 (NOT v5)
- Cascade behavior, type generation similar to v5
- Use `findUnique` (returns null) over `findUniqueOrThrow` in field resolvers to avoid uncaught errors

---

## Notes for Code Generation

When writing code, always:
1. Check this file for the exact installed version
2. If unsure about an API, check `node_modules/<package>/.../*.d.ts` directly
3. Don't write code from generic memory of "how the framework usually looks" — major versions matter
4. Backend tests must run against `arcane_ledger_test` DB (auto-enforced in test setup)
5. Build before declaring done: `npm run build` (frontend) or `npx tsc --noEmit` (backend)
