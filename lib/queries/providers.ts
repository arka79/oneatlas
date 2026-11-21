import { Prisma } from "@prisma/client";
import type { Modality, ModelType } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { paginationFor } from "@/lib/schemas/api-query";
import type { DirectorySearch } from "@/lib/schemas/directory-search";
import { dateToIsoDay, dateToIsoTimestamp, decimalToNumber } from "@/lib/serialize";

/**
 * Provider directory reads. List views select only summary fields plus a
 * filtered relation count; detail views use one nested select instead of
 * issuing a query per model.
 */

export type ProviderSummary = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  regions: string[];
  modelCount: number;
  updatedAt: string;
};

export type ProviderModelListing = {
  slug: string;
  name: string;
  modelType: ModelType;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number | null;
  inputPricePerMTokUsd: number;
  outputPricePerMTokUsd: number;
  modalities: Modality[];
  isOpenWeights: boolean;
  license: string;
  lab: { slug: string; name: string };
  /** Null means the provider uses the model's list price. */
  providerPrice: {
    inputPricePerMTokUsd: number | null;
    outputPricePerMTokUsd: number | null;
  };
  isAvailable: boolean;
  availableRegions: string[];
  notes: string | null;
};

export type ProviderDetail = ProviderSummary & {
  models: ProviderModelListing[];
};

export type ProviderListResult = {
  data: ProviderSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const providerSummarySelect = {
  slug: true,
  name: true,
  description: true,
  websiteUrl: true,
  regions: true,
  updatedAt: true,
  _count: { select: { offerings: true } },
} satisfies Prisma.ProviderSelect;

const providerDetailSelect = {
  ...providerSummarySelect,
  offerings: {
    orderBy: { model: { name: "asc" } },
    select: {
      isAvailable: true,
      availableRegions: true,
      notes: true,
      inputPricePerMTokUsd: true,
      outputPricePerMTokUsd: true,
      model: {
        select: {
          slug: true,
          name: true,
          modelType: true,
          releaseDate: true,
          contextWindow: true,
          maxOutputTokens: true,
          inputPricePerMTokUsd: true,
          outputPricePerMTokUsd: true,
          modalities: true,
          isOpenWeights: true,
          license: true,
          lab: { select: { slug: true, name: true } },
        },
      },
    },
  },
} satisfies Prisma.ProviderSelect;

type ProviderSummaryRow = Prisma.ProviderGetPayload<{ select: typeof providerSummarySelect }>;
type ProviderDetailRow = Prisma.ProviderGetPayload<{ select: typeof providerDetailSelect }>;

function toProviderSummary(row: ProviderSummaryRow): ProviderSummary {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    websiteUrl: row.websiteUrl,
    regions: row.regions,
    modelCount: row._count.offerings,
    updatedAt: dateToIsoTimestamp(row.updatedAt),
  };
}

function toProviderDetail(row: ProviderDetailRow): ProviderDetail {
  return {
    ...toProviderSummary(row),
    models: row.offerings.map((offering) => ({
      ...offering.model,
      releaseDate: dateToIsoDay(offering.model.releaseDate),
      inputPricePerMTokUsd: decimalToNumber(offering.model.inputPricePerMTokUsd),
      outputPricePerMTokUsd: decimalToNumber(offering.model.outputPricePerMTokUsd),
      providerPrice: {
        inputPricePerMTokUsd: decimalToNumber(offering.inputPricePerMTokUsd),
        outputPricePerMTokUsd: decimalToNumber(offering.outputPricePerMTokUsd),
      },
      isAvailable: offering.isAvailable,
      availableRegions: offering.availableRegions,
      notes: offering.notes,
    })),
  };
}

export async function listProviders(search: DirectorySearch): Promise<ProviderListResult> {
  const where: Prisma.ProviderWhereInput = search.q
    ? {
        OR: [
          { name: { contains: search.q, mode: "insensitive" } },
          { description: { contains: search.q, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await prisma.provider.count({ where });
  const pagination = paginationFor(total, search.page, search.pageSize);
  const rows = await prisma.provider.findMany({
    where,
    orderBy: { name: "asc" },
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: providerSummarySelect,
  });

  return {
    data: rows.map(toProviderSummary),
    ...pagination,
  };
}

export const getProviderBySlug = cache(
  async (slug: string): Promise<ProviderDetail | null> => {
    const row = await prisma.provider.findUnique({
      where: { slug },
      select: providerDetailSelect,
    });

    return row ? toProviderDetail(row) : null;
  },
);
