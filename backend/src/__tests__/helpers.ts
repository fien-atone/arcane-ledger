import { type Server } from 'http';
import request, { type Agent } from 'supertest';
import type { PrismaClient } from '@prisma/client';
import type { ApolloServer } from '@apollo/server';
import { createApp } from '../app.js';

// ── Test Users (from seed data) ─────────────────────────────────────────────
export const GM_EMAIL = 'gm@arcaneledger.app';
export const GM_PASSWORD = 'user';
export const PLAYER_EMAIL = 'ivan@arcaneledger.app';
export const PLAYER_PASSWORD = 'user';

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
 * Send a GraphQL request via supertest.
 * Returns parsed JSON body.
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
 * Log in as a user and return the JWT token.
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
 * Check if a GraphQL response contains an error with the given code.
 */
export function hasErrorCode(res: GraphQLResponse, code: string): boolean {
  return res.errors?.some((e) => e.extensions?.code === code) ?? false;
}

/**
 * Check if a GraphQL response contains any error (generic Error throws from resolvers
 * don't always have extension codes, so we check for error message patterns too).
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
