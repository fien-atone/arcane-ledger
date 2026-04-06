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
    const res = await graphql(request, ME_QUERY, undefined, validToken);
    expect(res.errors).toBeUndefined();
    expect(res.data?.me).toBeDefined();
    expect((res.data!.me as { email: string }).email).toBe(GM_EMAIL);
  });

  it('returns null user with no token', async () => {
    const res = await graphql(request, ME_QUERY);
    expect(res.errors).toBeUndefined();
    // me resolver returns user directly, which is null when unauthenticated
    expect(res.data?.me).toBeNull();
  });

  it('rejects an expired token', async () => {
    // Create a token that expired 1 hour ago
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
    const res = await graphql(request, ME_QUERY, undefined, 'this-is-not-a-valid-jwt');
    expect(res.data?.me).toBeNull();
  });

  it('rejects a token signed with wrong secret', async () => {
    const badToken = jwt.sign(
      { userId: 'user-gm' },
      'wrong-secret-entirely',
      { expiresIn: '7d' },
    );

    const res = await graphql(request, ME_QUERY, undefined, badToken);
    expect(res.data?.me).toBeNull();
  });

  it('rejects a token with nonexistent userId', async () => {
    const ghostToken = jwt.sign(
      { userId: 'user-that-does-not-exist' },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const res = await graphql(request, ME_QUERY, undefined, ghostToken);
    expect(res.data?.me).toBeNull();
  });
});
