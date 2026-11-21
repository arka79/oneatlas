import { jsonError, jsonOk, serverError } from "@/lib/api/response";
import { getProviderBySlug } from "@/lib/queries/providers";
import { slugSchema, toValidationIssues } from "@/lib/schemas/api-query";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

/** GET /api/providers/[slug] → provider, regions, and served models. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const parsedSlug = slugSchema.safeParse(slug);

  if (!parsedSlug.success) {
    return jsonError(400, "INVALID_SLUG", "Invalid provider slug.", {
      issues: toValidationIssues(parsedSlug.error),
    });
  }

  try {
    const provider = await getProviderBySlug(parsedSlug.data);

    if (!provider) {
      return jsonError(404, "PROVIDER_NOT_FOUND", `Provider "${slug}" was not found.`);
    }

    return jsonOk(provider);
  } catch (error) {
    return serverError(`GET /api/providers/${slug}`, error);
  }
}
