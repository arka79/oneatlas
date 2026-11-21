import { invalidBody, jsonError, jsonOk, serverError } from "@/lib/api/response";
import { getModelsBySlugs } from "@/lib/queries/models";
import { toValidationIssues } from "@/lib/schemas/api-query";
import { compareRequestSchema } from "@/lib/schemas/compare";

export const dynamic = "force-dynamic";

/**
 * POST /api/compare
 * Body: { "slugs": ["gpt-5", "claude-opus-4-1"] }
 *
 * Validates 2–4 unique model slugs, fetches them in one query, and returns
 * comparison-ready detail payloads in request order. Unknown slugs produce a
 * 404 listing every missing identifier.
 */
export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = compareRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return invalidBody(toValidationIssues(parsed.error));
  }

  try {
    const { models, missing } = await getModelsBySlugs(parsed.data.slugs);

    if (missing.length > 0) {
      return jsonError(404, "MODELS_NOT_FOUND", "One or more models were not found.", {
        missing,
      });
    }

    return jsonOk(
      { models },
      { requested: parsed.data.slugs.length, returned: models.length },
    );
  } catch (error) {
    return serverError("POST /api/compare", error);
  }
}
