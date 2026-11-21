import { Prisma } from "@prisma/client";
import type { Modality, ModelType } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { paginationFor } from "@/lib/schemas/api-query";
import type { DirectorySearch } from "@/lib/schemas/directory-search";
import { dateToIsoDay, dateToIsoTimestamp, decimalToNumber } from "@/lib/serialize";

/** Lab directory reads. Detail pages return the lab's portfolio in one query. */

export type LabSummary = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  country: string | null;
  foundedYear: number | null;
  modelCount: number;
  updatedAt: string;
};

export type LabModelSummary = {
  slug: string;
  name: string;
  description: string;
  modelType: ModelType;
  releaseDate: string;
  contextWindow: number;
  maxOutputTokens: number | null;
  inputPricePerMTokUsd: number;
  outputPricePerMTokUsd: number;
  modalities: Modality[];
  isOpenWeights: boolean;
  license: string;
  providerCount: number;
};

export type LabDetail = LabSummary & {
  models: LabModelSummary[];
};

export type LabListResult = {
  data: LabSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const labSummarySelect = {
  slug: true,
  name: true,
  description: true,
  websiteUrl: true,
  country: true,
  foundedYear: true,
  updatedAt: true,
  _count: { select: { models: true } },
} satisfies Prisma.LabSelect;

const labDetailSelect = {
  ...labSummarySelect,
  models: {
    orderBy: [{ releaseDate: "desc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      description: true,
      modelType: true,
      releaseDate: true,
      contextWindow: true,
      maxOutputTokens: true,
      inputPricePerMTokUsd: true,
      outputPricePerMTokUsd: true,
      modalities: true,
      isOpenWeights: true,
      license: true,
      _count: { select: { offerings: true } },
    },
  },
} satisfies Prisma.LabSelect;

type LabSummaryRow = Prisma.LabGetPayload<{ select: typeof labSummarySelect }>;
type LabDetailRow = Prisma.LabGetPayload<{ select: typeof labDetailSelect }>;

function toLabSummary(row: LabSummaryRow): LabSummary {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    websiteUrl: row.websiteUrl,
    country: row.country,
    foundedYear: row.foundedYear,
    modelCount: row._count.models,
    updatedAt: dateToIsoTimestamp(row.updatedAt),
  };
}

function toLabDetail(row: LabDetailRow): LabDetail {
  return {
    ...toLabSummary(row),
    models: row.models.map((model) => ({
      slug: model.slug,
      name: model.name,
      description: model.description,
      modelType: model.modelType,
      releaseDate: dateToIsoDay(model.releaseDate),
      contextWindow: model.contextWindow,
      maxOutputTokens: model.maxOutputTokens,
      inputPricePerMTokUsd: decimalToNumber(model.inputPricePerMTokUsd),
      outputPricePerMTokUsd: decimalToNumber(model.outputPricePerMTokUsd),
      modalities: model.modalities,
      isOpenWeights: model.isOpenWeights,
      license: model.license,
      providerCount: model._count.offerings,
    })),
  };
}

export async function listLabs(search: DirectorySearch): Promise<LabListResult> {
  const where: Prisma.LabWhereInput = search.q
    ? {
        OR: [
          { name: { contains: search.q, mode: "insensitive" } },
          { description: { contains: search.q, mode: "insensitive" } },
          { country: { contains: search.q, mode: "insensitive" } },
        ],
      }
    : {};

  const total = await prisma.lab.count({ where });
  const pagination = paginationFor(total, search.page, search.pageSize);
  const rows = await prisma.lab.findMany({
    where,
    orderBy: { name: "asc" },
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: labSummarySelect,
  });

  return {
    data: rows.map(toLabSummary),
    ...pagination,
  };
}

export const getLabBySlug = cache(async (slug: string): Promise<LabDetail | null> => {
  const row = await prisma.lab.findUnique({
    where: { slug },
    select: labDetailSelect,
  });

  return row ? toLabDetail(row) : null;
});
