import { prisma } from "@/lib/db";

export type CatalogStats = {
  models: number;
  labs: number;
  providers: number;
  benchmarks: number;
};

/**
 * Returns catalog counts, or `null` when the database is unreachable or not yet
 * migrated. The home page uses `null` to show setup instructions rather than
 * crashing on a fresh checkout.
 */
export async function getCatalogStats(): Promise<CatalogStats | null> {
  try {
    const [models, labs, providers, benchmarks] = await Promise.all([
      prisma.model.count(),
      prisma.lab.count(),
      prisma.provider.count(),
      prisma.benchmark.count(),
    ]);

    return { models, labs, providers, benchmarks };
  } catch (error) {
    console.error(
      "Could not load catalog stats. Is PostgreSQL running and migrated? Run `npm run db:up` and `npm run db:migrate`.",
      error,
    );
    return null;
  }
}
