import { z } from "zod";

/**
 * Validates the environment once at import time so misconfiguration fails with a
 * readable message instead of a cryptic connection error deep inside Prisma.
 */
const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Copy .env.example to .env and start the database."),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
