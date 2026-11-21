import type { NextRequest } from "next/server";
import { invalidQuery, jsonCollection, serverError } from "@/lib/api/response";
import { listLeaderboard } from "@/lib/queries/leaderboard";
import { parseSearchParams } from "@/lib/schemas/api-query";
import { leaderboardSearchSchema } from "@/lib/schemas/leaderboard-search";

export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard?benchmark=&category=&sort=&page=&pageSize=
 *
 * Rows are BenchmarkResult records joined to model, lab, and benchmark data.
 * Filter by exact benchmark slug and/or case-insensitive benchmark category.
 * `rank` is the position within the current filtered and sorted result set.
 */
export async function GET(request: NextRequest) {
  const parsed = parseSearchParams(leaderboardSearchSchema, request.nextUrl.searchParams);

  if (!parsed.success) {
    return invalidQuery(parsed.issues);
  }

  try {
    const result = await listLeaderboard(parsed.data);
    const { data, ...pagination } = result;
    return jsonCollection(data, pagination, {
      filters: {
        benchmark: parsed.data.benchmark ?? null,
        category: parsed.data.category ?? null,
        sort: parsed.data.sort,
      },
    });
  } catch (error) {
    return serverError("GET /api/leaderboard", error);
  }
}
