import type { Context } from '../context.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../auth/middleware.js';

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
  },
};
