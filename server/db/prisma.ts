import { PrismaClient } from "@prisma/client";

/**
 * Neon's pooled endpoint is PgBouncer in transaction mode. Prisma must know
 * that (`pgbouncer=true`) or prepared statements break intermittently.
 * The Vercel↔Neon integration injects DATABASE_URL without the flag, so add it here.
 */
function pooledUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("pgbouncer=true")) return url;
  return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: pooledUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
