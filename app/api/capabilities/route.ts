import { jsonOk, serverError } from "@/lib/api/response";
import { listCapabilities } from "@/lib/queries/capabilities";

export const dynamic = "force-dynamic";

/** GET /api/capabilities → `{ data: CapabilityOption[] }` for filter controls. */
export async function GET() {
  try {
    return jsonOk(await listCapabilities());
  } catch (error) {
    return serverError("GET /api/capabilities", error);
  }
}
