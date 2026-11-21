import { Prisma } from "@prisma/client";
import type { ModelType, VerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paginationFor } from "@/lib/schemas/api-query";
import type { LeaderboardSearch, LeaderboardSort } from "@/lib/schemas/leaderboard-search";
import { dateToIsoDay, dateToIsoTimestamp } from "@/lib/serialize";

/** Leaderboard rows are benchmark results joined to their model and definition. */

export type LeaderboardRow = {
  /** Position in the current filtered/sorted result set. */
  rank: number;
  score: number;
  model: {
    slug: string;
    name: string;
    modelType: ModelType;
    releaseDate: string;
    contextWindow: number;
    isOpenWeights: boolean;
    lab: { slug: string; name: string };
  };
  benchmark: {
    slug: string;
    name: string;
    category: string;
    unit: string;
    higherIsBetter: boolean;
    version: string | null;
  };
  verificationStatus: VerificationStatus;
  isIllustrative: boolean;
  sourceUrl: string | null;
  lastUpdated: string;
};

export type LeaderboardResult = {
  data: LeaderboardRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Benchmark definitions plus result coverage, used by the leaderboard filter. */
export type BenchmarkOption = {
  slug: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  version: string | null;
  resultCount: number;
  dataSource: string;
  sourceUrl: string | null;
  lastUpdated: string;
};

export type BenchmarkCatalog = {
  benchmarks: BenchmarkOption[];
  totalModels: number;
};

const leaderboardSelect = {
  score: true,
  sourceUrl: true,
  lastUpdated: true,
  verificationStatus: true,
  model: {
    select: {
      slug: true,
      name: true,
      modelType: true,
      releaseDate: true,
      contextWindow: true,
      isOpenWeights: true,
      lab: { select: { slug: true, name: true } },
    },
  },
  benchmark: {
    select: {
      slug: true,
      name: true,
      category: true,
      unit: true,
      higherIsBetter: true,
      version: true,
    },
  },
} satisfies Prisma.BenchmarkResultSelect;

type LeaderboardRowRaw = Prisma.BenchmarkResultGetPayload<{ select: typeof leaderboardSelect }>;

const benchmarkOptionSelect = {
  slug: true,
  name: true,
  description: true,
  category: true,
  unit: true,
  higherIsBetter: true,
  version: true,
  dataSource: true,
  sourceUrl: true,
  lastUpdated: true,
  _count: { select: { results: true } },
} satisfies Prisma.BenchmarkSelect;

type BenchmarkOptionRow = Prisma.BenchmarkGetPayload<{
  select: typeof benchmarkOptionSelect;
}>;

function leaderboardOrderBy(
  sort: LeaderboardSort,
): Prisma.BenchmarkResultOrderByWithRelationInput[] {
  switch (sort) {
    case "score-asc":
      return [{ score: "asc" }, { model: { name: "asc" } }];
    case "benchmark-asc":
      return [{ benchmark: { name: "asc" } }, { score: "desc" }];
    case "model-asc":
      return [{ model: { name: "asc" } }, { benchmark: { name: "asc" } }];
    case "release-date-desc":
      return [{ model: { releaseDate: "desc" } }, { score: "desc" }];
    case "score-desc":
    default:
      return [{ score: "desc" }, { model: { name: "asc" } }];
  }
}

function toBenchmarkOption(row: BenchmarkOptionRow): BenchmarkOption {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    higherIsBetter: row.higherIsBetter,
    version: row.version,
    resultCount: row._count.results,
    dataSource: row.dataSource,
    sourceUrl: row.sourceUrl,
    lastUpdated: dateToIsoTimestamp(row.lastUpdated),
  };
}

function toLeaderboardRow(row: LeaderboardRowRaw, rank: number): LeaderboardRow {
  return {
    rank,
    score: row.score,
    model: {
      ...row.model,
      releaseDate: dateToIsoDay(row.model.releaseDate),
    },
    benchmark: row.benchmark,
    verificationStatus: row.verificationStatus,
    isIllustrative: row.verificationStatus === "ILLUSTRATIVE",
    sourceUrl: row.sourceUrl,
    lastUpdated: dateToIsoTimestamp(row.lastUpdated),
  };
}

export async function getBenchmarkCatalog(): Promise<BenchmarkCatalog> {
  const [rows, totalModels] = await Promise.all([
    prisma.benchmark.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: benchmarkOptionSelect,
    }),
    prisma.model.count(),
  ]);

  return {
    benchmarks: rows.map(toBenchmarkOption),
    totalModels,
  };
}

export async function listLeaderboard(search: LeaderboardSearch): Promise<LeaderboardResult> {
  const where: Prisma.BenchmarkResultWhereInput = {};

  if (search.benchmark || search.category) {
    const benchmarkFilter: Prisma.BenchmarkWhereInput = {};
    if (search.benchmark) benchmarkFilter.slug = search.benchmark;
    if (search.category) {
      benchmarkFilter.category = { equals: search.category, mode: "insensitive" };
    }
    where.benchmark = benchmarkFilter;
  }

  const total = await prisma.benchmarkResult.count({ where });
  const pagination = paginationFor(total, search.page, search.pageSize);
  const offset = (pagination.page - 1) * pagination.pageSize;
  const rows = await prisma.benchmarkResult.findMany({
    where,
    orderBy: leaderboardOrderBy(search.sort),
    skip: offset,
    take: pagination.pageSize,
    select: leaderboardSelect,
  });

  return {
    data: rows.map((row, index) => toLeaderboardRow(row, offset + index + 1)),
    ...pagination,
  };
}
