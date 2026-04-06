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
  // NOTE: The backend currently uses open CORS (cors() with no options),
  // so all origins are allowed. These tests document the CURRENT behavior.
  // When CORS is tightened, update expectations accordingly.

  it('responds to OPTIONS preflight from any origin (currently open CORS)', async () => {
    const res = await request
      .options('/graphql')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    // With open CORS, the server reflects the origin back
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('responds to OPTIONS preflight from localhost (currently open CORS)', async () => {
    const res = await request
      .options('/graphql')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,authorization');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('includes CORS headers on actual POST requests', async () => {
    const res = await request
      .post('/graphql')
      .set('Origin', 'http://localhost:5173')
      .set('Content-Type', 'application/json')
      .send({ query: '{ __typename }' });

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
