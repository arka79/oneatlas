import type { CapabilityOption } from "@/lib/queries/capabilities";
import type { ModelDetail, ModelFilterOption, ModelSummary } from "@/lib/queries/models";

/**
 * Typed browser client for the OneAtlas JSON API. Pages that need interaction
 * use these functions rather than reaching into Prisma or duplicating fetch
 * error handling.
 */

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ModelListResponse = {
  data: ModelSummary[];
  meta: PaginationMeta;
};

type CollectionResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

type ItemListResponse<T> = {
  data: T[];
};

export type FilterOptions = {
  labs: ModelFilterOption[];
  providers: ModelFilterOption[];
  capabilities: CapabilityOption[];
};

export type CompareResponse = {
  data: { models: ModelDetail[] };
  meta: { requested: number; returned: number };
};

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: { code?: string; message?: string; details?: unknown } }
    | null;

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      payload?.error?.message ?? `Request failed with status ${response.status}.`,
      payload?.error?.code,
      payload?.error?.details,
    );
  }

  return payload as T;
}

export function fetchModels(queryString: string, signal?: AbortSignal) {
  return request<ModelListResponse>(`/api/models${queryString}`, { signal });
}

export async function fetchFilterOptions(signal?: AbortSignal): Promise<FilterOptions> {
  const [labs, providers, capabilities] = await Promise.all([
    request<CollectionResponse<{ slug: string; name: string }>>("/api/labs?pageSize=100", {
      signal,
    }),
    request<CollectionResponse<{ slug: string; name: string }>>("/api/providers?pageSize=100", {
      signal,
    }),
    request<ItemListResponse<CapabilityOption>>("/api/capabilities", { signal }),
  ]);

  return {
    labs: labs.data.map(({ slug, name }) => ({ value: slug, label: name })),
    providers: providers.data.map(({ slug, name }) => ({ value: slug, label: name })),
    capabilities: capabilities.data,
  };
}

export function compareModels(slugs: string[], signal?: AbortSignal) {
  return request<CompareResponse>("/api/compare", {
    method: "POST",
    body: JSON.stringify({ slugs }),
    signal,
  });
}
