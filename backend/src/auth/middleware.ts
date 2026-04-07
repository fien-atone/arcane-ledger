import jwt from 'jsonwebtoken';
import type { PrismaClient, User } from '@prisma/client';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required. Set it in .env or environment.');
  process.exit(1);
}
const JWT_SECRET: string = process.env.JWT_SECRET;

export interface JwtPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies JwtPayload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function authenticate(token: string, prisma: PrismaClient): Promise<User | null> {
  const payload = verifyToken(token);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
}
