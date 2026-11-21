import { Prisma } from "@prisma/client";
import type { ModelType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { dateToIsoDay, dateToIsoTimestamp, decimalToNumber } from "@/lib/serialize";

/**
 * Dashboard reads kept in the shared query layer. Counts, recent releases,
 * price leaders, context leaders, and the type mix all come from PostgreSQL;
 * there are no hand-authored trend numbers.
 */

export type DashboardStats = {
  models: number;
  labs: number;
  providers: number;
  benchmarks: number;
};

export type DashboardModel = {
  slug: string;
  name: string;
  lab: { slug: string; name: string };
  modelType: ModelType;
  releaseDate: string;
  contextWindow: number;
  inputPricePerMTokUsd: number;
  outputPricePerMTokUsd: number;
  providerCount: number;
  lastUpdated: string;
};

export type DashboardData = {
  stats: DashboardStats;
  recentModels: DashboardModel[];
  cheapestInput: DashboardModel[];
  largestContext: DashboardModel[];
  typeCounts: Array<{ modelType: ModelType; count: number }>;
};

const dashboardModelSelect = {
  slug: true,
  name: true,
  lab: { select: { slug: true, name: true } },
  modelType: true,
  releaseDate: true,
  contextWindow: true,
  inputPricePerMTokUsd: true,
  outputPricePerMTokUsd: true,
  lastUpdated: true,
  _count: { select: { offerings: true } },
} satisfies Prisma.ModelSelect;

type DashboardModelRow = Prisma.ModelGetPayload<{ select: typeof dashboardModelSelect }>;

function toDashboardModel(row: DashboardModelRow): DashboardModel {
  return {
    slug: row.slug,
    name: row.name,
    lab: row.lab,
    modelType: row.modelType,
    releaseDate: dateToIsoDay(row.releaseDate),
    contextWindow: row.contextWindow,
    inputPricePerMTokUsd: decimalToNumber(row.inputPricePerMTokUsd),
    outputPricePerMTokUsd: decimalToNumber(row.outputPricePerMTokUsd),
    providerCount: row._count.offerings,
    lastUpdated: dateToIsoTimestamp(row.lastUpdated),
  };
}

export async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const [
      models,
      labs,
      providers,
      benchmarks,
      recentRows,
      cheapestRows,
      largestRows,
      typeGroups,
    ] = await Promise.all([
      prisma.model.count(),
      prisma.lab.count(),
      prisma.provider.count(),
      prisma.benchmark.count(),
      prisma.model.findMany({
        orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
        take: 5,
        select: dashboardModelSelect,
      }),
      prisma.model.findMany({
        where: { inputPricePerMTokUsd: { gt: 0 } },
        orderBy: [{ inputPricePerMTokUsd: "asc" }, { name: "asc" }],
        take: 3,
        select: dashboardModelSelect,
      }),
      prisma.model.findMany({
        orderBy: [{ contextWindow: "desc" }, { name: "asc" }],
        take: 3,
        select: dashboardModelSelect,
      }),
      prisma.model.groupBy({
        by: ["modelType"],
        _count: { _all: true },
      }),
    ]);

    const typeCounts = typeGroups
      .map((group) => ({ modelType: group.modelType, count: group._count._all }))
      .sort((a, b) => b.count - a.count || a.modelType.localeCompare(b.modelType));

    return {
      stats: { models, labs, providers, benchmarks },
      recentModels: recentRows.map(toDashboardModel),
      cheapestInput: cheapestRows.map(toDashboardModel),
      largestContext: largestRows.map(toDashboardModel),
      typeCounts,
    };
  } catch (error) {
    console.error(
      "Could not load dashboard data. Is PostgreSQL running and seeded? Run `npm run db:up`, `npm run db:migrate`, and `npm run db:seed`.",
      error,
    );
    return null;
  }
}
