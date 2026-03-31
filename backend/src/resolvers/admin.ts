import type { Context } from '../context.js';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { requireAdmin } from './utils.js';

interface AdminCreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface AdminUpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const adminResolvers = {
  User: {
    createdAt: (user: { createdAt: Date }) => user.createdAt.toISOString(),
  },

  Query: {
    adminUsers: async (_: unknown, { search }: { search?: string }, { prisma, user }: Context) => {
      requireAdmin(user);

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      return prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    adminCreateUser: async (
      _: unknown,
      { input }: { input: AdminCreateUserInput },
      { prisma, user }: Context,
    ) => {
      requireAdmin(user);

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const role = input.role ? input.role.toUpperCase() : 'USER';

      try {
        return await prisma.user.create({
          data: {
            email: input.email,
            name: input.name,
            password: hashedPassword,
            role: role as 'ADMIN' | 'USER',
          },
        });
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
          throw new GraphQLError('A user with this email already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw err;
      }
    },

    adminUpdateUser: async (
      _: unknown,
      { id, input }: { id: string; input: AdminUpdateUserInput },
      { prisma, user }: Context,
    ) => {
      requireAdmin(user);

      // Prevent self-demotion
      if (id === user.id && input.role && input.role.toUpperCase() !== 'ADMIN') {
        throw new GraphQLError('Cannot remove your own admin role', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const data: Record<string, unknown> = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.email !== undefined) data.email = input.email;
      if (input.role !== undefined) data.role = input.role.toUpperCase();
      if (input.password && input.password.length > 0) {
        data.password = await bcrypt.hash(input.password, 10);
      }

      try {
        return await prisma.user.update({ where: { id }, data });
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
          throw new GraphQLError('A user with this email already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw err;
      }
    },

    adminDeleteUser: async (
      _: unknown,
      { id }: { id: string },
      { prisma, user }: Context,
    ) => {
      requireAdmin(user);

      if (id === user.id) {
        throw new GraphQLError('Cannot delete your own account', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      await prisma.user.delete({ where: { id } });
      return true;
    },
  },
};
