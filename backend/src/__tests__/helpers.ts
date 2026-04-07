/**
 * Test Helpers
 *
 * Shared utilities for all backend integration tests. Provides:
 * - Pre-configured test user credentials matching the seed data
 * - A `getTestApp()` factory that boots a real Apollo Server on a random port
 * - `graphql()` / `loginAs()` helpers to send authenticated GraphQL requests
 * - `hasErrorCode()` / `hasAuthError()` helpers to inspect error responses
 *
 * Every test suite calls `getTestApp()` in beforeAll and `cleanup()` in afterAll
 * to ensure the server and DB connection are properly created and torn down.
 */

import { type Server } from 'http';
import request, { type Agent } from 'supertest';
import type { PrismaClient } from '@prisma/client';
import type { ApolloServer } from '@apollo/server';
import { createApp } from '../app.js';

// ── Test Users (from seed data) ─────────────────────────────────────────────
/** GM user — has full access to all campaigns they own */
export const GM_EMAIL = 'gm@arcaneledger.app';
export const GM_PASSWORD = 'user';
/** Player user (Ivan) — has PLAYER role in the Farchester campaign */
export const PLAYER_EMAIL = 'ivan@arcaneledger.app';
export const PLAYER_PASSWORD = 'user';

/** The seeded Farchester campaign used by most tests as a shared fixture */
export const CAMPAIGN_ID = 'campaign-farchester';

// ── Test App ─────────────────────────────────────────────────────────────────

interface TestApp {
  /** Supertest agent bound to the running server */
  request: Agent;
  /** Prisma client for direct DB access in tests */
  prisma: PrismaClient;
  /** Tear down server + DB connection */
  cleanup: () => Promise<void>;
}

/**
 * Boot a full Apollo Server instance on a random port for integration testing.
 * Returns a supertest agent, a Prisma client for direct DB access, and a
 * cleanup function that stops all servers and disconnects from the database.
 */
export async function getTestApp(): Promise<TestApp> {
  const { app, httpServer, prisma, server, wsServer } = await createApp();

  // Start on random port
  await new Promise<void>((resolve) => {
    httpServer.listen(0, resolve);
  });

  const agent = request(httpServer);

  return {
    request: agent,
    prisma,
    cleanup: async () => {
      await server.stop();
      wsServer.close();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      await prisma.$disconnect();
    },
  };
}

// ── GraphQL helpers ──────────────────────────────────────────────────────────

interface GraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string; extensions?: { code?: string } }>;
}

/**
 * Send a GraphQL request to the test server via supertest.
 * Optionally attaches a JWT Bearer token for authenticated requests.
 * Returns the parsed JSON body containing `data` and/or `errors`.
 */
export async function graphql(
  agent: Agent,
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GraphQLResponse> {
  const req = agent
    .post('/graphql')
    .set('Content-Type', 'application/json');

  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }

  const res = await req.send({ query, variables });
  return res.body as GraphQLResponse;
}

/**
 * Authenticate as a specific user via the login mutation.
 * Returns the JWT token string for use in subsequent authorized requests.
 * Throws if login fails (e.g., wrong credentials or missing seed user).
 */
export async function loginAs(
  agent: Agent,
  email: string,
  password: string,
): Promise<string> {
  const res = await graphql(agent, `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        token
      }
    }
  `, { email, password });

  if (!res.data?.login) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.errors)}`);
  }
  return (res.data.login as { token: string }).token;
}

/**
 * Check if a GraphQL response contains an error with a specific Apollo error code
 * (e.g., 'UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT').
 */
export function hasErrorCode(res: GraphQLResponse, code: string): boolean {
  return res.errors?.some((e) => e.extensions?.code === code) ?? false;
}

/**
 * Check if a GraphQL response contains an authentication/authorization error.
 * Checks both Apollo error codes (UNAUTHENTICATED, FORBIDDEN) and common
 * error message patterns, because some resolvers throw generic Errors
 * without extension codes.
 */
export function hasAuthError(res: GraphQLResponse): boolean {
  if (!res.errors || res.errors.length === 0) return false;
  return res.errors.some(
    (e) =>
      e.extensions?.code === 'UNAUTHENTICATED' ||
      e.extensions?.code === 'FORBIDDEN' ||
      /not authenticated/i.test(e.message) ||
      /only the gm/i.test(e.message) ||
      /admin access/i.test(e.message),
  );
}
