import type { NextRequest } from "next/server";
import { invalidQuery, jsonCollection, serverError } from "@/lib/api/response";
import { listModels } from "@/lib/queries/models";
import { parseModelSearchParams } from "@/lib/schemas/model-search";

export const dynamic = "force-dynamic";

/**
 * GET /api/models
 *
 * Search, filter by lab/provider/type/capability/modality/weights/input price,
 * sort, and paginate the database-backed catalogue. Invalid values return 400
 * with per-field issues instead of silently falling back.
 */
export async function GET(request: NextRequest) {
  const parsed = parseModelSearchParams(request.nextUrl.searchParams);

  if (!parsed.success) {
    return invalidQuery(parsed.issues);
  }

  try {
    const result = await listModels(parsed.data);
    const { data, ...pagination } = result;
    return jsonCollection(data, pagination);
  } catch (error) {
    return serverError("GET /api/models", error);
  }
}
