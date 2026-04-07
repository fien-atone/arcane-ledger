/**
 * CORS Configuration Tests
 *
 * Verifies that the backend restricts CORS to a known whitelist of frontend
 * origins (localhost:5173 and localhost:3000 by default). Malicious origins
 * must NOT receive an `Access-Control-Allow-Origin` header reflecting them.
 *
 * Tests cover: OPTIONS preflight from a disallowed origin, preflight from
 * each whitelisted localhost origin, and CORS headers on actual POST requests.
 *
 * Prerequisites: none (no authentication needed).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Agent } from 'supertest';
import { getTestApp } from '../helpers.js';

let request: Agent;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  cleanup = app.cleanup;
});

afterAll(async () => {
  await cleanup();
});

describe('CORS', () => {
  it('blocks OPTIONS preflight from a disallowed origin', async () => {
    // A malicious origin must NOT be reflected back in the
    // Access-Control-Allow-Origin header. The cors middleware simply omits
    // the header (and does not set it to the origin) when the origin is not
    // in the whitelist.
    const res = await request
      .options('/graphql')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('https://evil.example.com');
    expect(allowOrigin).not.toBe('*');
  });

  it('allows OPTIONS preflight from http://localhost:5173', async () => {
    // The Vite dev server origin must be accepted and reflected back.
    const res = await request
      .options('/graphql')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('allows OPTIONS preflight from http://localhost:3000', async () => {
    // The alternate localhost dev origin must also be accepted.
    const res = await request
      .options('/graphql')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('includes CORS headers on actual POST requests from allowed origin', async () => {
    // Verify that CORS headers are also present on real GraphQL POST requests,
    // not just on OPTIONS preflight. Uses a minimal introspection query.
    const res = await request
      .post('/graphql')
      .set('Origin', 'http://localhost:5173')
      .set('Content-Type', 'application/json')
      .send({ query: '{ __typename }' });

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not reflect a disallowed origin on POST requests', async () => {
    // Even on a successful POST, the server must not reflect an untrusted
    // origin back in the CORS headers.
    const res = await request
      .post('/graphql')
      .set('Origin', 'https://evil.example.com')
      .set('Content-Type', 'application/json')
      .send({ query: '{ __typename }' });

    const allowOrigin = res.headers['access-control-allow-origin'];
    expect(allowOrigin).not.toBe('https://evil.example.com');
    expect(allowOrigin).not.toBe('*');
  });
});
