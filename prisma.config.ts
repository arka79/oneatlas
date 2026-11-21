import { loadEnvFile } from "node:process";
import { defineConfig } from "prisma/config";

/**
 * Prisma 6 config file. Unlike `package.json#prisma`, a config file makes the
 * Prisma CLI skip automatic `.env` loading, so load it here. Environment
 * variables set by the host take precedence and are left untouched.
 *
 * Production note (serverless / managed PostgreSQL such as Neon):
 *   - DATABASE_URL  = pooled connection used by the app at runtime
 *                     (Neon serverless/pooler endpoint; append ?sslmode=require
 *                     if your provider does not enable it by default).
 *   - DIRECT_URL    = direct (non-pooled) connection used by Prisma for
 *                     `prisma migrate deploy` and `prisma db seed`.
 *                     Set both in Vercel project settings; never commit either.
 */
try {
  loadEnvFile();
} catch {
  // No local `.env`; production/CI is expected to provide DATABASE_URL directly.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
