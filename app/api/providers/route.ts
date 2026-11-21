import type { NextRequest } from "next/server";
import { invalidQuery, jsonCollection, serverError } from "@/lib/api/response";
import { listProviders } from "@/lib/queries/providers";
import { parseSearchParams } from "@/lib/schemas/api-query";
import { directorySearchSchema } from "@/lib/schemas/directory-search";

export const dynamic = "force-dynamic";

/**
 * GET /api/providers?q=&page=&pageSize=
 *
 * Lists inference providers with their region coverage and number of model
 * listings. Search matches provider name and description.
 */
export async function GET(request: NextRequest) {
  const parsed = parseSearchParams(directorySearchSchema, request.nextUrl.searchParams);

  if (!parsed.success) {
    return invalidQuery(parsed.issues);
  }

  try {
    const result = await listProviders(parsed.data);
    const { data, ...pagination } = result;
    return jsonCollection(data, pagination);
  } catch (error) {
    return serverError("GET /api/providers", error);
  }
}
