// Prisma client singleton. `--watch` (bun dev) re-evaluates modules on save,
// so we cache the client on `globalThis` to avoid exhausting Postgres
// connections with a new client per reload.
import { PrismaClient } from '@prisma/client'

const g = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = g.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') g.prisma = prisma
