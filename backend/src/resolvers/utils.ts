import type { User } from '@prisma/client';
import { GraphQLError } from 'graphql';

/** Normalise an enum value to UPPERCASE (frontend may send lowercase). */
export const toEnum = <T extends string>(val: string | undefined | null, fallback: T): T =>
  (val ? val.toUpperCase() : fallback) as T;

/** Throw if the current user is not an authenticated ADMIN. */
export function requireAdmin(user: User | null): asserts user is User {
  if (!user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  if (user.role !== 'ADMIN') throw new GraphQLError('Admin access required', { extensions: { code: 'FORBIDDEN' } });
}
