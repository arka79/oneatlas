import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Next.js hot-reloads server modules in development, which would otherwise open
 * a new connection pool on every reload. Cache the client on `globalThis`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
