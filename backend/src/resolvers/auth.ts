import type { Context } from '../context.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../auth/middleware.js';
import { pubsub } from '../pubsub.js';

export const authResolvers = {
  Query: {
    me: (_: unknown, __: unknown, { user }: Context) => user,
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }, { prisma }: Context) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !await bcrypt.compare(password, user.password)) {
        throw new Error('Invalid credentials');
      }
      return { token: signToken(user.id), user };
    },

    updateProfile: async (_: unknown, { name }: { name: string }, { user, prisma }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const result = await prisma.user.update({ where: { id: user.id }, data: { name } });
      try { pubsub.publish('USERS_CHANGED', { usersChanged: true }); } catch { /* ignore */ }
      return result;
    },

    changePassword: async (
      _: unknown,
      { currentPassword, newPassword, confirmPassword }: { currentPassword: string; newPassword: string; confirmPassword: string },
      { user, prisma }: Context,
    ) => {
      if (!user) throw new Error('Not authenticated');
      if (newPassword !== confirmPassword) throw new Error('Passwords do not match');

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser || !await bcrypt.compare(currentPassword, dbUser.password)) {
        throw new Error('Current password is incorrect');
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      return true;
    },
  },
};
