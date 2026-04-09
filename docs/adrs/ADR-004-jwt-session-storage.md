# ADR-004: JWT in sessionStorage, not cookies

**Status:** Accepted
**Date:** 2026-03-27 (retrospective)
**Decided by:** team-lead + user
**Related:** ADR-001 (GraphQL auth), SECURITY.md T-8

## Context

The app needs authenticated requests. JWT is the standard approach for SPA
+ API architectures. The question is where to store the token on the
client: `sessionStorage`, `localStorage`, or HTTP-only cookies.

## Decision

JWT access token stored in **sessionStorage** under the key `auth_token`.
Apollo Client reads it via a `setContext` auth link and sends it as
`Authorization: Bearer <token>`.

## Alternatives considered

- **HTTP-only cookies** — immune to JavaScript-based XSS token theft, but
  require CSRF protection (token, SameSite attribute, origin checks). This
  adds complexity across client and server. For an SPA without server-side
  rendering, the cookie advantages are smaller.
- **localStorage** — persistent across tabs and browser restarts. We chose
  `sessionStorage` instead so a closed tab ends the session; this trades
  convenience for a smaller attack window.
- **In-memory only** — safest against XSS but loses session on page reload,
  which is a terrible UX.

## Consequences

**Positive:**
- Simple implementation: one `setContext` link, one `sessionStorage.getItem`
- No CSRF concerns (no cookies means no ambient authority)
- Session ends when the tab closes, which is good for shared devices
- Works cleanly with GraphQL over both HTTP and WebSocket subscriptions

**Negative:**
- Susceptible to token theft via stored XSS — mitigated by DOMPurify on
  all rich-text rendering (implemented in 0.3.1), but not zero risk
- User has to log in again for every new tab
- Token is accessible to any script running on the origin — we must be
  careful about third-party scripts (we currently have none)

## Notes

See `docs/SECURITY.md` T-5 (Stored XSS) for the related threat and
mitigation. If XSS protection ever weakens, this ADR should be revisited;
HTTP-only cookies become more attractive when the XSS risk is higher.

JWT secret (`JWT_SECRET` env var) is required at startup in 0.3.1 — no
insecure default. Documented in SECURITY.md T-7.
