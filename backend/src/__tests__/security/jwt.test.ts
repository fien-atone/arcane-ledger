/**
 * JWT Authentication Security Tests
 *
 * Tests the JWT token lifecycle and error handling. Verifies that:
 * - Valid tokens authenticate successfully and resolve the correct user
 * - Missing tokens result in null user (graceful degradation, not hard error)
 * - Expired tokens are rejected
 * - Malformed tokens are rejected
 * - Tokens signed with wrong secrets are rejected
 * - Tokens referencing nonexistent users resolve to null
 *
 * Uses the `me` query as the authentication probe since it directly returns
 * the authenticated user (or null).
 *
 * Prerequisites: seeded GM user in database.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Agent } from 'supertest';
import jwt from 'jsonwebtoken';
import {
  getTestApp,
  loginAs,
  graphql,
  GM_EMAIL,
  GM_PASSWORD,
} from '../helpers.js';

let request: Agent;
let cleanup: () => Promise<void>;
let validToken: string;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  cleanup = app.cleanup;
  validToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
});

afterAll(async () => {
  await cleanup();
});

const ME_QUERY = `query { me { id email name } }`;

describe('JWT Authentication', () => {
  it('authenticates with a valid token', async () => {
    // Send a valid JWT obtained via the login mutation.
    // Verify: me query returns the user with the correct email.
    const res = await graphql(request, ME_QUERY, undefined, validToken);
    expect(res.errors).toBeUndefined();
    expect(res.data?.me).toBeDefined();
    expect((res.data!.me as { email: string }).email).toBe(GM_EMAIL);
  });

  it('returns null user with no token', async () => {
    // Send request with no Authorization header.
    // Verify: me query returns null (graceful unauthenticated state, not an error).
    const res = await graphql(request, ME_QUERY);
    expect(res.errors).toBeUndefined();
    // me resolver returns user directly, which is null when unauthenticated
    expect(res.data?.me).toBeNull();
  });

  it('rejects an expired token', async () => {
    // Forge a token with expiresIn: -1h (already expired).
    // Verify: server treats it like no token (me returns null), not a hard error.
    const expiredToken = jwt.sign(
      { userId: 'user-gm' },
      JWT_SECRET,
      { expiresIn: '-1h' },
    );

    const res = await graphql(request, ME_QUERY, undefined, expiredToken);
    // Expired token leads to null user, same as no token
    expect(res.data?.me).toBeNull();
  });

  it('rejects a malformed token', async () => {
    // Send a garbage string as the Bearer token.
    // Verify: server ignores the invalid token and returns null user.
    const res = await graphql(request, ME_QUERY, undefined, 'this-is-not-a-valid-jwt');
    expect(res.data?.me).toBeNull();
  });

  it('rejects a token signed with wrong secret', async () => {
    // Forge a token with a valid payload but signed with a different secret.
    // Verify: signature verification fails and server returns null user.
    const badToken = jwt.sign(
      { userId: 'user-gm' },
      'wrong-secret-entirely',
      { expiresIn: '7d' },
    );

    const res = await graphql(request, ME_QUERY, undefined, badToken);
    expect(res.data?.me).toBeNull();
  });

  it('rejects a token with nonexistent userId', async () => {
    // Forge a validly-signed token but with a userId that does not exist in the database.
    // Verify: the DB lookup returns no user, so me resolves to null.
    const ghostToken = jwt.sign(
      { userId: 'user-that-does-not-exist' },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const res = await graphql(request, ME_QUERY, undefined, ghostToken);
    expect(res.data?.me).toBeNull();
  });
});
