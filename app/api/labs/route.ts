import type { NextRequest } from "next/server";
import { invalidQuery, jsonCollection, serverError } from "@/lib/api/response";
import { listLabs } from "@/lib/queries/labs";
import { parseSearchParams } from "@/lib/schemas/api-query";
import { directorySearchSchema } from "@/lib/schemas/directory-search";

export const dynamic = "force-dynamic";

/**
 * GET /api/labs?q=&page=&pageSize=
 *
 * Lists research labs with model counts. Search matches name, description, and
 * country.
 */
export async function GET(request: NextRequest) {
  const parsed = parseSearchParams(directorySearchSchema, request.nextUrl.searchParams);

  if (!parsed.success) {
    return invalidQuery(parsed.issues);
  }

  try {
    const result = await listLabs(parsed.data);
    const { data, ...pagination } = result;
    return jsonCollection(data, pagination);
  } catch (error) {
    return serverError("GET /api/labs", error);
  }
}
