# Frontend Agent — Arcane Ledger

You are working on the **frontend** of Arcane Ledger — a TTRPG campaign management app.

See the root `../CLAUDE.md` for full conventions, design system, and component library.

---

## Stack

- React 19 + TypeScript 5.9 (strict) + Vite 8
- Apollo Client (GraphQL) — replaces TanStack Query
- Tailwind CSS v4 (`@theme` in `index.css`)
- TipTap 3 for rich text
- Zustand for auth state

---

## Architecture — Feature-Sliced Design

```
src/
  app/          — router, providers (ApolloProvider), layout
  pages/        — one file per route
  widgets/      — Sidebar, Topbar, DiceRoller, ChangelogDrawer
  features/     — domain slices, each with api/ui/model
  shared/
    ui/         — reusable components (see root CLAUDE.md)
    api/        — apolloClient.ts
  entities/     — TypeScript types
```

---

## Data Layer

All data comes from GraphQL API at `VITE_GRAPHQL_URL`.

Query hooks live in `features/<domain>/api/queries.ts` using Apollo Client:

```ts
import { gql, useQuery, useMutation } from '@apollo/client';

const QUERY = gql`query { ... }`;

export const useFoo = (id: string) => {
  const { data, loading, error } = useQuery<any>(QUERY, { variables: { id } });
  return { data: data?.foo, isLoading: loading, isError: !!error };
};
```

Mutations use `refetchQueries` for cache invalidation.

**Mock mode** (`VITE_USE_MOCK=true`) — localStorage data via repositories. Still works for offline development.

---

## Auth

- JWT token stored in `sessionStorage` under key `auth_token`
- Apollo Client reads it via `setContext` auth link
- Login via GraphQL `login` mutation in `features/auth/model/store.ts`
- Auth state in Zustand store (`useAuthStore`)

---

## Commands

```bash
npm run dev      # start dev server on :5173
npm run build    # production build + type check
```

**Always run `npm run build` before declaring work done** — it catches errors that dev mode misses.

---

## Key Rules

- Never use native `<select>` — use `Select` from shared/ui
- Never use native `<input type="date">` — use `DatePicker` from shared/ui
- Never render location icons inline — use `LocationIcon` from shared/ui
- Never use browser `confirm()` — use inline confirm (Yes/No)
- Location type colors via `CATEGORY_HEX_COLOR` with inline `style={{ color }}`
- Always `(entity.arrayField ?? [])` for optional arrays
- IDs come from the server (UUID) — never generate on client for saved entities
