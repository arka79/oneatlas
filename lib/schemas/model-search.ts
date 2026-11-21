import type { ModelType } from "@prisma/client";
import { z } from "zod";

/**
 * Single source of truth for catalogue query params. `/models` and
 * `GET /api/models` both parse the same URL with this schema, so the page and
 * the API can never disagree about defaults, allowed values, or page size.
 */

export const MODEL_SORTS = [
  "release-date-desc",
  "release-date-asc",
  "name-asc",
  "input-price-asc",
  "input-price-desc",
  "output-price-asc",
  "output-price-desc",
  "context-desc",
] as const;

export type ModelSort = (typeof MODEL_SORTS)[number];

export const MODEL_SORT_LABELS: Record<ModelSort, string> = {
  "release-date-desc": "Release date (newest)",
  "release-date-asc": "Release date (oldest)",
  "name-asc": "Name (A–Z)",
  "input-price-asc": "Input price (low to high)",
  "input-price-desc": "Input price (high to low)",
  "output-price-asc": "Output price (low to high)",
  "output-price-desc": "Output price (high to low)",
  "context-desc": "Context window (largest)",
};

/** Old bookmarks and the M1 UI keep working; canonical output uses the new keys. */
export const MODEL_SORT_ALIASES = {
  newest: "release-date-desc",
  "price-asc": "input-price-asc",
  "price-desc": "input-price-desc",
} as const satisfies Record<string, ModelSort>;

export const MODEL_TYPES = [
  "GENERAL",
  "REASONING",
  "CODING",
  "MULTIMODAL",
  "EMBEDDING",
] as const;

export type ModelTypeValue = (typeof MODEL_TYPES)[number];

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  GENERAL: "General purpose",
  REASONING: "Reasoning",
  CODING: "Code",
  MULTIMODAL: "Multimodal",
  EMBEDDING: "Embedding",
};

export const MODALITIES = ["TEXT", "IMAGE", "AUDIO", "VIDEO", "CODE"] as const;
export type ModalityValue = (typeof MODALITIES)[number];

export const MODALITY_LABELS: Record<ModalityValue, string> = {
  TEXT: "Text",
  IMAGE: "Image",
  AUDIO: "Audio",
  VIDEO: "Video",
  CODE: "Code",
};

/**
 * Nine cards fit a 3-column grid exactly. The seeded catalogue has fifty
 * models, so pagination is exercised without inflating a page.
 */
export const MODEL_PAGE_SIZE = 9;

export const modelSearchSchema = z.object({
  /** Free text matched against model name, description, licence, and lab name. */
  q: z.string().trim().max(80, "Search must be 80 characters or fewer.").optional(),
  lab: z.string().trim().max(80).optional(),
  provider: z.string().trim().max(80).optional(),
  type: z.enum(MODEL_TYPES).optional(),
  capability: z.string().trim().max(80).optional(),
  modality: z.enum(MODALITIES).optional(),
  /** Tri-state: omitted means any weights, "true" means open weights only. */
  openWeights: z.enum(["true", "false"]).optional(),
  /** USD ceiling applied to the model's first-party input price per 1M tokens. */
  maxPrice: z.coerce.number().min(0, "Price ceiling cannot be negative.").max(10_000).optional(),
  sort: z.enum(MODEL_SORTS).default("release-date-desc"),
  page: z.coerce.number().int().min(1, "Page must be 1 or greater.").max(1_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(MODEL_PAGE_SIZE),
});

export type ModelSearch = z.infer<typeof modelSearchSchema>;

export const DEFAULT_MODEL_SEARCH: ModelSearch = modelSearchSchema.parse({});

export type ModelSearchIssue = { field: string; message: string };
export type ModelSearchParseResult =
  | { success: true; data: ModelSearch }
  | { success: false; issues: ModelSearchIssue[] };

const allowedKeys = new Set(Object.keys(modelSearchSchema.shape));

/**
 * Reads only known params and drops blanks, so `?q=&sort=` behaves like no
 * filter instead of failing validation. Unknown params are ignored rather than
 * rejected, which keeps tracking links from breaking the catalogue.
 */
export function parseModelSearchParams(input: URLSearchParams): ModelSearchParseResult {
  const values: Record<string, string> = {};

  for (const [key, rawValue] of input.entries()) {
    const value = rawValue.trim();
    if (value === "" || !allowedKeys.has(key)) {
      continue;
    }
    values[key] = value;
  }

  if (values.sort && values.sort in MODEL_SORT_ALIASES) {
    values.sort = MODEL_SORT_ALIASES[values.sort as keyof typeof MODEL_SORT_ALIASES];
  }

  const parsed = modelSearchSchema.safeParse(values);

  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "query",
        message: issue.message,
      })),
    };
  }

  return { success: true, data: parsed.data };
}

/**
 * Rebuilds a `/models` query string for pagination and filter links. Defaults
 * are omitted so the canonical first page is plain `/models`.
 */
export function buildModelSearchQuery(search: ModelSearch, overrides: { page?: number } = {}): string {
  const params = new URLSearchParams();

  if (search.q) params.set("q", search.q);
  if (search.lab) params.set("lab", search.lab);
  if (search.provider) params.set("provider", search.provider);
  if (search.type) params.set("type", search.type);
  if (search.capability) params.set("capability", search.capability);
  if (search.modality) params.set("modality", search.modality);
  if (search.openWeights) params.set("openWeights", search.openWeights);
  if (search.maxPrice !== undefined) params.set("maxPrice", String(search.maxPrice));
  if (search.sort !== "release-date-desc") params.set("sort", search.sort);
  if (search.pageSize !== MODEL_PAGE_SIZE) params.set("pageSize", String(search.pageSize));

  const page = overrides.page ?? search.page;
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `?${query}` : "";
}
