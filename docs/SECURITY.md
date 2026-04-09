# Security — Threat Model and Audit Log

**Owned by:** security-engineer
**Last updated:** 2026-04-10

This document is the living threat model for Arcane Ledger. It describes
what we protect against, how, where the current gaps are, and a running
log of audits. It is NOT a generic OWASP checklist — it's specific to this
project.

## Assets we protect

1. **User credentials** — passwords (bcrypt-hashed), JWT tokens
2. **Campaign data** — everything inside a campaign: NPCs, locations, sessions, quests, notes, images
3. **GM-only fields** — `gmNotes`, private session summaries, visibility-hidden data
4. **Personal data** — user emails, names, avatars
5. **Admin capabilities** — ability to create/delete users, manage accounts

## Threat model

### T-1: Brute-force on login

**Description:** attacker tries many password combinations against `gm@arcaneledger.app` or other known accounts.

**Mitigation:**
- Passwords are bcrypt-hashed (cost 10)
- **GAP:** no rate limiting on login mutation (tracked as F-18)

**Severity if exploited:** 🔴 critical — account takeover

### T-2: Horizontal privilege escalation (cross-campaign)

**Description:** player in campaign A reads or writes data from campaign B via crafted GraphQL queries.

**Mitigation:**
- Every query scopes by `campaignId` from the resolver
- `CampaignMember.role` check enforces per-campaign membership
- Functional tests cover authorization on all mutations (see `backend/src/__tests__/security/mutation-auth.test.ts`)

**Severity if exploited:** 🔴 critical — data leakage across campaigns

### T-3: Vertical privilege escalation (player → GM)

**Description:** player sees GM-only fields like `gmNotes`, private session summaries, or entity fields that should be hidden.

**Mitigation:**
- Resolvers filter `playerVisibleFields` server-side — sensitive data never reaches the client
- Field-level visibility system (implemented in 0.3.0)
- `requireGM` helper on every mutation that edits GM-only content

**Severity if exploited:** 🟡 important — depends on content

### T-4: System role escalation (USER → ADMIN)

**Description:** regular user gains ADMIN privileges to access the admin panel and manage other users.

**Mitigation:**
- `systemRole: 'USER' | 'ADMIN'` on User model
- Admin-only resolvers check `ctx.user.role === 'ADMIN'`
- Tests in `backend/src/__tests__/security/admin-endpoint.test.ts` cover privilege escalation attempts + SQL injection

**Severity if exploited:** 🔴 critical — full system control

### T-5: Stored XSS via rich text

**Description:** attacker stores malicious `<script>` or JavaScript-bearing HTML in an NPC description or quest field; when another user views it, the script executes.

**Mitigation:**
- All `dangerouslySetInnerHTML` uses DOMPurify sanitization (implemented in 0.3.1, T-8)
- Input comes through TipTap which only produces a limited set of tags

**Severity if exploited:** 🟡 important — session theft, user impersonation

### T-6: File upload attacks

**Description:** attacker uploads a file with:
- Path traversal in filename (`../../../etc/passwd`)
- Mismatched MIME type (actual JavaScript file claiming to be an image)
- Oversized file causing DoS

**Mitigation:**
- Files stored by server-generated UUIDs — original filename is never used for the path
- Path is `uploads/campaign/{id}/{entity}/{uuid}.ext`
- 10MB size limit via multer
- **GAP:** MIME type is trusted from upload headers, not verified by content inspection
- **GAP:** no file content scanning

**Severity if exploited:** 🟡 important — host compromise possible

### T-7: JWT attacks

**Description:**
- Expired tokens reused
- Tokens signed with wrong secret
- Tokens forged claiming to be a different user
- Tokens for deleted users

**Mitigation:**
- `JWT_SECRET` required at startup (fails if missing — implemented in 0.3.1)
- Tokens expire after 7 days
- Verification middleware checks signature, expiry, and user existence
- Full coverage in `backend/src/__tests__/security/jwt.test.ts`

**Severity if exploited:** 🔴 critical — session hijacking

### T-8: CORS bypass

**Description:** attacker hosts a malicious page that tricks a logged-in user's browser into making authenticated requests to the backend.

**Mitigation:**
- CORS restricted to known origins (`localhost:5173`, `localhost:3000`, configurable via `CORS_ORIGINS` env)
- Hardcoded `evil.com`-style origins are rejected
- Coverage in `backend/src/__tests__/security/cors.test.ts`
- JWT in `sessionStorage` (not cookies) — mitigates CSRF in the traditional sense

**Severity if exploited:** 🟡 important

### T-9: SQL injection

**Description:** attacker injects SQL via a GraphQL query variable that reaches a raw SQL statement.

**Mitigation:**
- Prisma ORM — all queries are type-safe and parameterized
- Zero usage of `$queryRaw` / `$executeRaw` in current codebase
- If any future feature introduces raw SQL, security-engineer review is mandatory

**Severity if exploited:** 🔴 critical

### T-10: GraphQL introspection in production

**Description:** GraphQL introspection endpoint exposes the full schema, aiding attackers in reconnaissance.

**Mitigation:**
- **GAP:** not currently disabled in production. Fine for development. Before production deploy, introspection must be disabled for non-admin requests. Tracked as a follow-up item.

**Severity if exploited:** 🟢 low (information disclosure only)

### T-11: DoS via expensive queries

**Description:** attacker crafts deeply-nested or very wide GraphQL queries that overwhelm the server.

**Mitigation:**
- **GAP:** no query depth/complexity limits
- **GAP:** no per-IP rate limiting beyond F-18 (which is login-only)
- Fine for current single-user development. Before production, add depth limit and per-IP throttling.

**Severity if exploited:** 🟡 important in production, 🟢 low in development

### T-12: Secret leakage

**Description:** credentials, JWT secrets, or API keys accidentally committed to git or logged in plaintext.

**Mitigation:**
- `.env` files git-ignored
- `docker-compose.yml` uses `${VAR}` references, not hardcoded secrets (cleaned up in 0.3.1)
- Periodic audit of git history + logs required (security-engineer task)
- **GAP:** no automated secret scanning (pre-commit hook or GitHub push protection would help)

**Severity if exploited:** 🔴 critical

## Known gaps summary

| Gap | Severity | Status | Tracked as |
|---|---|---|---|
| No rate limit on login | 🔴 | Planned | F-18 (next) |
| MIME type not content-verified on uploads | 🟡 | Open | — (add ticket if it becomes actionable) |
| Password minimum is 4 characters | 🟢 | Open | F-20 |
| Email format not validated on backend | 🟢 | Open | F-21 |
| GraphQL introspection enabled everywhere | 🟢 | Deferred to prod prep | — |
| No GraphQL depth/complexity limits | 🟡 | Deferred to prod prep | — |
| No Zod input validation on mutations | 🟡 | Open | T-8 |
| No automated secret scanning | 🟢 | Deferred | — |

## Audit history

| Date | Auditor | Scope | Outcome | Notes |
|---|---|---|---|---|
| 0.3.1 | (pre-security-engineer) | Backend authorization — GM role checks on all mutations | 61 tests added, all mutations covered | Recorded as T-7 done in BACKLOG |
| 0.3.1 | (pre-security-engineer) | Admin endpoint privilege escalation + SQL injection | 15 tests added | Recorded as part of 0.3.1 release |
| 0.3.1 | (pre-security-engineer) | XSS in rich text rendering | DOMPurify added to all `dangerouslySetInnerHTML` | Recorded as T-8 done |
| 2026-04-10 | team-lead (stand-in) | Initial threat model documentation | 12 threats documented, 8 gaps identified | First version of this doc |

## How to update this document

- **Adding a new threat** — when security-engineer identifies a new attack surface, add a new T-N entry with mitigation status
- **Closing a gap** — when a gap is fixed, move it from the "Known gaps" table to "Closed gaps" at the bottom (add a section when first closed) and update the related T-N entry
- **Periodic audits** — add a row to the audit history with scope and outcome
- **Version bumps** — when a dependency with security implications is upgraded (or found vulnerable), note it here

## Closed gaps

_(Empty — will fill as gaps are resolved)_
