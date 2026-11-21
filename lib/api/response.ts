import type { ValidationIssue } from "@/lib/schemas/api-query";

/**
 * Every JSON endpoint except `/api/health` uses one of these envelopes:
 *   success:   { data }
 *   collection:{ data, meta: { page, pageSize, total, totalPages, ... } }
 *   error:     { error: { code, message, details? } }
 *
 * Keeping this in one module prevents route handlers from inventing their own
 * status codes or error field names.
 */

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function jsonOk<T>(data: T, meta?: Record<string, unknown>) {
  return Response.json(meta ? { data, meta } : { data });
}

export function jsonCollection<T>(
  data: T[],
  pagination: Pagination,
  extraMeta: Record<string, unknown> = {},
) {
  return Response.json({
    data,
    meta: { ...pagination, ...extraMeta },
  });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  return Response.json(
    {
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status },
  );
}

export function invalidQuery(issues: ValidationIssue[]) {
  return jsonError(400, "INVALID_QUERY", "Invalid query parameters.", { issues });
}

export function invalidBody(issues: ValidationIssue[]) {
  return jsonError(400, "INVALID_BODY", "Invalid request body.", { issues });
}

export function serverError(scope: string, error: unknown) {
  console.error(`${scope} failed:`, error);
  return jsonError(503, "DATABASE_UNAVAILABLE", "The catalog database is unavailable.");
}
