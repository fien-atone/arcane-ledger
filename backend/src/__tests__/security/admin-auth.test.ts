/**
 * Admin Endpoint Security Tests
 *
 * Verifies that all admin user-management endpoints (adminUsers query,
 * adminCreateUser, adminUpdateUser, adminDeleteUser mutations) are
 * protected by `requireAdmin()`. Only users with system role 'ADMIN'
 * may access them — regular users and unauthenticated requests are
 * rejected with proper error codes.
 *
 * This is critical because admin endpoints can create/modify/delete
 * any user account in the system, including changing roles. A leak
 * here is a full system takeover.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Agent } from 'supertest';
import type { PrismaClient } from '@prisma/client';
import {
  getTestApp,
  loginAs,
  graphql,
  hasErrorCode,
  hasAuthError,
  GM_EMAIL,
  GM_PASSWORD,
  PLAYER_EMAIL,
  PLAYER_PASSWORD,
} from '../helpers.js';

let request: Agent;
let prisma: PrismaClient;
let cleanup: () => Promise<void>;
let adminToken: string;
let playerToken: string;

beforeAll(async () => {
  const app = await getTestApp();
  request = app.request;
  prisma = app.prisma;
  cleanup = app.cleanup;
  // GM in seed has system role ADMIN
  adminToken = await loginAs(request, GM_EMAIL, GM_PASSWORD);
  // Ivan is a PLAYER (system role: USER)
  playerToken = await loginAs(request, PLAYER_EMAIL, PLAYER_PASSWORD);
});

afterAll(async () => {
  await cleanup();
});

const ADMIN_USERS_QUERY = `
  query AdminUsers { adminUsers { id email name role } }
`;

const ADMIN_CREATE_USER = `
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    adminCreateUser(input: $input) { id email name role }
  }
`;

const ADMIN_UPDATE_USER = `
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) { id email name role }
  }
`;

const ADMIN_DELETE_USER = `
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id)
  }
`;

describe('Admin endpoints — authorization', () => {
  describe('adminUsers query (list users)', () => {
    it('rejects unauthenticated requests', async () => {
      // No token sent — requireAdmin throws UNAUTHENTICATED
      const res = await graphql(request, ADMIN_USERS_QUERY);
      expect(hasAuthError(res)).toBe(true);
    });

    it('rejects non-admin (regular USER) with FORBIDDEN', async () => {
      // Player has system role USER, not ADMIN
      const res = await graphql(request, ADMIN_USERS_QUERY, {}, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
    });

    it('allows admin to list all users', async () => {
      const res = await graphql(request, ADMIN_USERS_QUERY, {}, adminToken);
      expect(res.errors).toBeUndefined();
      const users = res.data!.adminUsers as Array<unknown>;
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });
  });

  describe('adminCreateUser mutation', () => {
    const validInput = {
      input: {
        name: 'Test User Should Not Be Created',
        email: `unauthorized-${Date.now()}@test.invalid`,
        password: 'somepass',
        role: 'USER',
      },
    };

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, ADMIN_CREATE_USER, validInput);
      expect(hasAuthError(res)).toBe(true);
      // Verify the user was NOT created
      const sneaky = await prisma.user.findUnique({ where: { email: validInput.input.email } });
      expect(sneaky).toBeNull();
    });

    it('rejects regular USER with FORBIDDEN', async () => {
      const input = {
        input: {
          ...validInput.input,
          email: `player-attempt-${Date.now()}@test.invalid`,
        },
      };
      const res = await graphql(request, ADMIN_CREATE_USER, input, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      const sneaky = await prisma.user.findUnique({ where: { email: input.input.email } });
      expect(sneaky).toBeNull();
    });

    it('rejects regular USER trying to escalate themselves to ADMIN', async () => {
      // The most dangerous attack: a regular user crafts a request to create
      // an ADMIN account they control. Authorization must block this.
      const input = {
        input: {
          name: 'Escalated Admin',
          email: `escalation-${Date.now()}@test.invalid`,
          password: 'attacker',
          role: 'ADMIN', // <-- attempting privilege escalation
        },
      };
      const res = await graphql(request, ADMIN_CREATE_USER, input, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      const sneaky = await prisma.user.findUnique({ where: { email: input.input.email } });
      expect(sneaky).toBeNull();
    });

    it('allows admin to create a user', async () => {
      const input = {
        input: {
          name: 'Legitimately Created',
          email: `legit-${Date.now()}@test.invalid`,
          password: 'password123',
          role: 'USER',
        },
      };
      const res = await graphql(request, ADMIN_CREATE_USER, input, adminToken);
      expect(res.errors).toBeUndefined();
      const created = res.data!.adminCreateUser as { id: string; email: string };
      expect(created.email).toBe(input.input.email);
      // Cleanup
      await prisma.user.delete({ where: { id: created.id } });
    });
  });

  describe('adminUpdateUser mutation', () => {
    let targetUserId: string;

    beforeAll(async () => {
      // Create a target user we'll try to attack
      const u = await prisma.user.create({
        data: {
          email: `update-target-${Date.now()}@test.invalid`,
          name: 'Update Target',
          password: 'hashed',
          role: 'USER',
        },
      });
      targetUserId = u.id;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: targetUserId } }).catch(() => {});
    });

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, ADMIN_UPDATE_USER, {
        id: targetUserId,
        input: { name: 'Hacked' },
      });
      expect(hasAuthError(res)).toBe(true);
    });

    it('rejects regular USER trying to modify another user', async () => {
      const res = await graphql(request, ADMIN_UPDATE_USER, {
        id: targetUserId,
        input: { name: 'Hacked by Player' },
      }, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      // Verify name unchanged
      const fresh = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(fresh?.name).toBe('Update Target');
    });

    it('rejects regular USER trying to elevate target to ADMIN', async () => {
      // Privilege escalation via update
      const res = await graphql(request, ADMIN_UPDATE_USER, {
        id: targetUserId,
        input: { role: 'ADMIN' },
      }, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      const fresh = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(fresh?.role).toBe('USER');
    });

    it('rejects regular USER trying to elevate themselves to ADMIN', async () => {
      // The classic vertical privilege escalation attack
      const player = await prisma.user.findUnique({ where: { email: PLAYER_EMAIL } });
      const res = await graphql(request, ADMIN_UPDATE_USER, {
        id: player!.id,
        input: { role: 'ADMIN' },
      }, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      const fresh = await prisma.user.findUnique({ where: { id: player!.id } });
      expect(fresh?.role).toBe('USER');
    });
  });

  describe('adminDeleteUser mutation', () => {
    let targetUserId: string;

    beforeAll(async () => {
      const u = await prisma.user.create({
        data: {
          email: `delete-target-${Date.now()}@test.invalid`,
          name: 'Delete Target',
          password: 'hashed',
          role: 'USER',
        },
      });
      targetUserId = u.id;
    });

    afterAll(async () => {
      await prisma.user.delete({ where: { id: targetUserId } }).catch(() => {});
    });

    it('rejects unauthenticated requests', async () => {
      const res = await graphql(request, ADMIN_DELETE_USER, { id: targetUserId });
      expect(hasAuthError(res)).toBe(true);
      const stillThere = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(stillThere).not.toBeNull();
    });

    it('rejects regular USER trying to delete another user', async () => {
      const res = await graphql(request, ADMIN_DELETE_USER, { id: targetUserId }, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      const stillThere = await prisma.user.findUnique({ where: { id: targetUserId } });
      expect(stillThere).not.toBeNull();
    });

    it('rejects regular USER trying to delete the admin account', async () => {
      // Worst case: attacker deletes the only admin → denial of service
      const admin = await prisma.user.findUnique({ where: { email: GM_EMAIL } });
      const res = await graphql(request, ADMIN_DELETE_USER, { id: admin!.id }, playerToken);
      expect(hasErrorCode(res, 'FORBIDDEN')).toBe(true);
      const stillThere = await prisma.user.findUnique({ where: { id: admin!.id } });
      expect(stillThere).not.toBeNull();
    });
  });

  describe('adminUsers query — search injection safety', () => {
    it('treats search parameter as a literal string (Prisma parameterizes)', async () => {
      // Prisma parameterizes all queries — this is a defense-in-depth check
      // that the search field doesn't somehow bypass the WHERE clause.
      const res = await graphql(
        request,
        ADMIN_USERS_QUERY.replace('adminUsers', 'adminUsers(search: "\' OR 1=1 --")'),
        {},
        adminToken,
      );
      // Should return zero matches, not all users
      expect(res.errors).toBeUndefined();
      const users = res.data!.adminUsers as Array<unknown>;
      // No user has that literal string in their name/email
      expect(users.length).toBe(0);
    });
  });
});
