import { jsonError, jsonOk, serverError } from "@/lib/api/response";
import { getModelBySlug } from "@/lib/queries/models";
import { slugSchema, toValidationIssues } from "@/lib/schemas/api-query";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/models/[slug]
 *
 * Returns the model plus its lab, provider listings, normalised capabilities,
 * and benchmark results. One nested query serves the whole detail payload.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const parsedSlug = slugSchema.safeParse(slug);

  if (!parsedSlug.success) {
    return jsonError(400, "INVALID_SLUG", "Invalid model slug.", {
      issues: toValidationIssues(parsedSlug.error),
    });
  }

  try {
    const model = await getModelBySlug(parsedSlug.data);

    if (!model) {
      return jsonError(404, "MODEL_NOT_FOUND", `Model "${slug}" was not found.`);
    }

    return jsonOk(model);
  } catch (error) {
    return serverError(`GET /api/models/${slug}`, error);
  }
}
