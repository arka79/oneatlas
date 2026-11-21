import { jsonError, jsonOk, serverError } from "@/lib/api/response";
import { getLabBySlug } from "@/lib/queries/labs";
import { slugSchema, toValidationIssues } from "@/lib/schemas/api-query";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

/** GET /api/labs/[slug] → lab profile and its model portfolio. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const parsedSlug = slugSchema.safeParse(slug);

  if (!parsedSlug.success) {
    return jsonError(400, "INVALID_SLUG", "Invalid lab slug.", {
      issues: toValidationIssues(parsedSlug.error),
    });
  }

  try {
    const lab = await getLabBySlug(parsedSlug.data);

    if (!lab) {
      return jsonError(404, "LAB_NOT_FOUND", `Lab "${slug}" was not found.`);
    }

    return jsonOk(lab);
  } catch (error) {
    return serverError(`GET /api/labs/${slug}`, error);
  }
}
