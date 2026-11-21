import { z } from "zod";

/**
 * Shared API query primitives. Handlers should parse query strings through
 * `parseSearchParams` rather than reading `searchParams` directly, so blank
 * values behave as absent and validation errors have one shape.
 */

export const pageField = z.coerce
  .number()
  .int()
  .min(1, "Page must be 1 or greater.")
  .max(1_000)
  .default(1);

export const pageSizeField = z.coerce
  .number()
  .int()
  .min(1, "Page size must be 1 or greater.")
  .max(100)
  .default(25);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(100, "Slug must be 100 characters or fewer.")
  .regex(SLUG_PATTERN, "Slug must contain only lowercase letters, digits, and hyphens.");

export type ValidationIssue = { field: string; message: string };

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; issues: ValidationIssue[] };

export function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "query",
    message: issue.message,
  }));
}

/**
 * Reads only non-blank params and lets the schema strip unknown keys. This
 * keeps campaign/tracking params from turning a valid request into a 400 while
 * still rejecting invalid values for known params.
 */
export function parseSearchParams<T>(
  schema: z.ZodType<T>,
  input: URLSearchParams,
): ParseResult<T> {
  const values: Record<string, string> = {};

  for (const [key, rawValue] of input.entries()) {
    const value = rawValue.trim();
    if (value !== "") {
      values[key] = value;
    }
  }

  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { success: false, issues: toValidationIssues(parsed.error) };
  }

  return { success: true, data: parsed.data };
}

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Clamps an out-of-range page before querying, then reports the served page. */
export function paginationFor(total: number, page: number, pageSize: number): Pagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page: Math.min(page, totalPages),
    pageSize,
    total,
    totalPages,
  };
}
