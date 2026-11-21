import { Prisma } from "@prisma/client";
import type { Modality, ModelType, VerificationStatus } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { paginationFor } from "@/lib/schemas/api-query";
import type { ModelSearch, ModelSort } from "@/lib/schemas/model-search";
import { dateToIsoDay, dateToIsoTimestamp, decimalToNumber } from "@/lib/serialize";

/**
 * Model catalogue reads. Pages and route handlers must go through this module
 * instead of importing Prisma, so filtering, ordering, pagination, and Decimal
 * serialization are defined exactly once.
 */

export type ModelSummary = {
  slug: string;
  name: string;
  description: string;
  lab: { slug: string; name: string };
  modelType: ModelType;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number | null;
  inputPricePerMTokUsd: number;
  outputPricePerMTokUsd: number;
  modalities: Modality[];
  isOpenWeights: boolean;
  license: string;
  knowledgeCutoff: string | null;
  dataSource: string;
  sourceUrl: string | null;
  lastUpdated: string;
  verificationStatus: VerificationStatus;
  isIllustrative: boolean;
  providerCount: number;
  providers: Array<{ slug: string; name: string }>;
  capabilities: Array<{ slug: string; name: string }>;
};

export type ModelProviderListing = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  regions: string[];
  isAvailable: boolean;
  availableRegions: string[];
  /** Null means "use the model's list price". */
  inputPricePerMTokUsd: number | null;
  outputPricePerMTokUsd: number | null;
};

export type ModelBenchmarkResult = {
  slug: string;
  name: string;
  category: string;
  unit: string;
  higherIsBetter: boolean;
  score: number;
  sourceUrl: string | null;
  lastUpdated: string;
  verificationStatus: VerificationStatus;
  isIllustrative: boolean;
};

export type ModelCapabilityInfo = {
  slug: string;
  name: string;
  description: string;
  category: string;
};

export type ModelDetail = {
  slug: string;
  name: string;
  description: string;
  lab: {
    slug: string;
    name: string;
    description: string;
    websiteUrl: string;
    country: string | null;
    foundedYear: number | null;
  };
  modelType: ModelType;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number | null;
  inputPricePerMTokUsd: number;
  outputPricePerMTokUsd: number;
  modalities: Modality[];
  isOpenWeights: boolean;
  license: string;
  knowledgeCutoff: string | null;
  dataSource: string;
  sourceUrl: string | null;
  lastUpdated: string;
  verificationStatus: VerificationStatus;
  isIllustrative: boolean;
  capabilities: ModelCapabilityInfo[];
  providers: ModelProviderListing[];
  benchmarks: ModelBenchmarkResult[];
};

export type RelatedModel = ModelSummary & {
  relation: "Same lab" | "Similar type + capability";
};

export type ModelListResult = {
  data: ModelSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ModelFilterOption = { value: string; label: string };
export type ModelFilterOptions = {
  labs: ModelFilterOption[];
  providers: ModelFilterOption[];
};

const modelSummarySelect = {
  slug: true,
  name: true,
  description: true,
  lab: { select: { slug: true, name: true } },
  modelType: true,
  releaseDate: true,
  contextWindow: true,
  maxOutputTokens: true,
  inputPricePerMTokUsd: true,
  outputPricePerMTokUsd: true,
  modalities: true,
  isOpenWeights: true,
  license: true,
  knowledgeCutoff: true,
  dataSource: true,
  sourceUrl: true,
  lastUpdated: true,
  verificationStatus: true,
  offerings: {
    where: { isAvailable: true },
    orderBy: { provider: { name: "asc" } },
    select: { provider: { select: { slug: true, name: true } } },
  },
  capabilities: {
    orderBy: { capability: { name: "asc" } },
    select: { capability: { select: { slug: true, name: true } } },
  },
} satisfies Prisma.ModelSelect;

const modelDetailSelect = {
  slug: true,
  name: true,
  description: true,
  lab: {
    select: {
      slug: true,
      name: true,
      description: true,
      websiteUrl: true,
      country: true,
      foundedYear: true,
    },
  },
  modelType: true,
  releaseDate: true,
  contextWindow: true,
  maxOutputTokens: true,
  inputPricePerMTokUsd: true,
  outputPricePerMTokUsd: true,
  modalities: true,
  isOpenWeights: true,
  license: true,
  knowledgeCutoff: true,
  dataSource: true,
  sourceUrl: true,
  lastUpdated: true,
  verificationStatus: true,
  capabilities: {
    orderBy: { capability: { name: "asc" } },
    select: {
      capability: { select: { slug: true, name: true, description: true, category: true } },
    },
  },
  offerings: {
    orderBy: { provider: { name: "asc" } },
    select: {
      isAvailable: true,
      availableRegions: true,
      inputPricePerMTokUsd: true,
      outputPricePerMTokUsd: true,
      provider: {
        select: { slug: true, name: true, description: true, websiteUrl: true, regions: true },
      },
    },
  },
  benchmarkResults: {
    orderBy: { benchmark: { name: "asc" } },
    select: {
      score: true,
      sourceUrl: true,
      lastUpdated: true,
      verificationStatus: true,
      benchmark: {
        select: { slug: true, name: true, category: true, unit: true, higherIsBetter: true },
      },
    },
  },
} satisfies Prisma.ModelSelect;

type ModelSummaryRow = Prisma.ModelGetPayload<{ select: typeof modelSummarySelect }>;
type ModelDetailRow = Prisma.ModelGetPayload<{ select: typeof modelDetailSelect }>;

function toModelSummary(row: ModelSummaryRow): ModelSummary {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    lab: row.lab,
    modelType: row.modelType,
    releaseDate: dateToIsoDay(row.releaseDate),
    contextWindow: row.contextWindow,
    maxOutputTokens: row.maxOutputTokens,
    inputPricePerMTokUsd: decimalToNumber(row.inputPricePerMTokUsd),
    outputPricePerMTokUsd: decimalToNumber(row.outputPricePerMTokUsd),
    modalities: row.modalities,
    isOpenWeights: row.isOpenWeights,
    license: row.license,
    knowledgeCutoff: row.knowledgeCutoff,
    dataSource: row.dataSource,
    sourceUrl: row.sourceUrl,
    lastUpdated: dateToIsoTimestamp(row.lastUpdated),
    verificationStatus: row.verificationStatus,
    isIllustrative: row.verificationStatus === "ILLUSTRATIVE",
    providerCount: row.offerings.length,
    providers: row.offerings.map(({ provider }) => provider),
    capabilities: row.capabilities.map(({ capability }) => capability),
  };
}

function toModelDetail(row: ModelDetailRow): ModelDetail {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    lab: row.lab,
    modelType: row.modelType,
    releaseDate: dateToIsoDay(row.releaseDate),
    contextWindow: row.contextWindow,
    maxOutputTokens: row.maxOutputTokens,
    inputPricePerMTokUsd: decimalToNumber(row.inputPricePerMTokUsd),
    outputPricePerMTokUsd: decimalToNumber(row.outputPricePerMTokUsd),
    modalities: row.modalities,
    isOpenWeights: row.isOpenWeights,
    license: row.license,
    knowledgeCutoff: row.knowledgeCutoff,
    dataSource: row.dataSource,
    sourceUrl: row.sourceUrl,
    lastUpdated: dateToIsoTimestamp(row.lastUpdated),
    verificationStatus: row.verificationStatus,
    isIllustrative: row.verificationStatus === "ILLUSTRATIVE",
    capabilities: row.capabilities.map(({ capability }) => capability),
    providers: row.offerings
      .map((offering) => ({
        ...offering.provider,
        isAvailable: offering.isAvailable,
        availableRegions: offering.availableRegions,
        inputPricePerMTokUsd: decimalToNumber(offering.inputPricePerMTokUsd),
        outputPricePerMTokUsd: decimalToNumber(offering.outputPricePerMTokUsd),
      }))
      .sort(
        (a, b) => Number(b.isAvailable) - Number(a.isAvailable) || a.name.localeCompare(b.name),
      ),
    benchmarks: row.benchmarkResults.map((entry) => ({
      ...entry.benchmark,
      score: entry.score,
      sourceUrl: entry.sourceUrl,
      lastUpdated: dateToIsoTimestamp(entry.lastUpdated),
      verificationStatus: entry.verificationStatus,
      isIllustrative: entry.verificationStatus === "ILLUSTRATIVE",
    })),
  };
}

/** Exported for reuse in API tests and future saved-search features. */
export function buildModelWhere(search: ModelSearch): Prisma.ModelWhereInput {
  const where: Prisma.ModelWhereInput = {};
  const term = search.q?.trim();

  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { license: { contains: term, mode: "insensitive" } },
      { lab: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  if (search.lab) where.lab = { slug: search.lab };
  if (search.provider) where.offerings = { some: { provider: { slug: search.provider } } };
  if (search.type) where.modelType = search.type;
  if (search.capability) {
    where.capabilities = { some: { capability: { slug: search.capability } } };
  }
  if (search.modality) where.modalities = { has: search.modality };
  if (search.openWeights) where.isOpenWeights = search.openWeights === "true";
  if (search.maxPrice !== undefined) where.inputPricePerMTokUsd = { lte: search.maxPrice };

  return where;
}

function modelOrderBy(sort: ModelSort): Prisma.ModelOrderByWithRelationInput[] {
  switch (sort) {
    case "name-asc":
      return [{ name: "asc" }];
    case "input-price-asc":
      return [{ inputPricePerMTokUsd: "asc" }, { name: "asc" }];
    case "input-price-desc":
      return [{ inputPricePerMTokUsd: "desc" }, { name: "asc" }];
    case "output-price-asc":
      return [{ outputPricePerMTokUsd: "asc" }, { name: "asc" }];
    case "output-price-desc":
      return [{ outputPricePerMTokUsd: "desc" }, { name: "asc" }];
    case "context-desc":
      return [{ contextWindow: "desc" }, { name: "asc" }];
    case "release-date-asc":
      return [{ releaseDate: "asc" }, { name: "asc" }];
    case "release-date-desc":
    default:
      return [{ releaseDate: "desc" }, { name: "asc" }];
  }
}

/**
 * Counts first so an out-of-range `page` can be clamped to the last real page
 * instead of rendering a confusing empty grid.
 */
export async function listModels(search: ModelSearch): Promise<ModelListResult> {
  const where = buildModelWhere(search);
  const total = await prisma.model.count({ where });
  const pagination = paginationFor(total, search.page, search.pageSize);

  const rows = await prisma.model.findMany({
    where,
    orderBy: modelOrderBy(search.sort),
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: modelSummarySelect,
  });

  return {
    data: rows.map(toModelSummary),
    ...pagination,
  };
}

/** Select options for the filter panel; a small, bounded read. */
export async function getModelFilterOptions(): Promise<ModelFilterOptions> {
  const [labs, providers] = await Promise.all([
    prisma.lab.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.provider.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  return {
    labs: labs.map(({ slug, name }) => ({ value: slug, label: name })),
    providers: providers.map(({ slug, name }) => ({ value: slug, label: name })),
  };
}

/**
 * Memoized per request with React `cache` so `generateMetadata` and the page
 * body share one query when a model detail page renders.
 */
export const getModelBySlug = cache(async (slug: string): Promise<ModelDetail | null> => {
  const row = await prisma.model.findUnique({
    where: { slug },
    select: modelDetailSelect,
  });

  return row ? toModelDetail(row) : null;
});

export type ModelsBySlugsResult = {
  models: ModelDetail[];
  missing: string[];
};

/**
 * Related models use two explicit, meaningful rules: another model from the
 * same lab, then a model of the same type sharing at least one capability.
 * There is no synthetic "you may also like" data.
 */
export async function getRelatedModels(model: ModelDetail, limit = 3): Promise<RelatedModel[]> {
  const rowLimit = Math.max(0, Math.min(limit, 6));
  if (rowLimit === 0) return [];

  const sameLabRows = await prisma.model.findMany({
    where: { slug: { not: model.slug }, lab: { slug: model.lab.slug } },
    orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
    take: rowLimit,
    select: modelSummarySelect,
  });

  const related: RelatedModel[] = sameLabRows.map((row) => ({
    ...toModelSummary(row),
    relation: "Same lab",
  }));

  if (related.length >= rowLimit || model.capabilities.length === 0) {
    return related;
  }

  const capabilitySlugs = model.capabilities.map((capability) => capability.slug);
  const sharedRows = await prisma.model.findMany({
    where: {
      slug: { notIn: [model.slug, ...related.map((entry) => entry.slug)] },
      modelType: model.modelType,
      capabilities: {
        some: { capability: { slug: { in: capabilitySlugs } } },
      },
    },
    orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
    take: rowLimit - related.length,
    select: modelSummarySelect,
  });

  return [
    ...related,
    ...sharedRows.map((row) => ({
      ...toModelSummary(row),
      relation: "Similar type + capability" as const,
    })),
  ];
}

/**
 * One bounded `slug IN (...)` query for compare. Results are returned in the
 * caller's order so the response matches the requested comparison columns.
 */
export async function getModelsBySlugs(slugs: string[]): Promise<ModelsBySlugsResult> {
  const uniqueSlugs = [...new Set(slugs)];
  const rows = await prisma.model.findMany({
    where: { slug: { in: uniqueSlugs } },
    select: modelDetailSelect,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, toModelDetail(row)]));

  return {
    models: uniqueSlugs.flatMap((slug) => {
      const model = bySlug.get(slug);
      return model ? [model] : [];
    }),
    missing: uniqueSlugs.filter((slug) => !bySlug.has(slug)),
  };
}
