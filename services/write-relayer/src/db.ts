// Prisma client singleton, cached on globalThis so `bun --watch` reloads
// don't open a new connection pool each time.
import { PrismaClient } from './generated/prisma'

const g = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = g.prisma ?? new PrismaClient()

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production')
  g.prisma = prisma
