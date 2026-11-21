import { prisma } from "@/lib/db";

export type CapabilityOption = {
  slug: string;
  name: string;
  description: string;
  category: string;
};

/** Capability definitions are a small, bounded table; no pagination needed. */
export async function listCapabilities(): Promise<CapabilityOption[]> {
  return prisma.capability.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { slug: true, name: true, description: true, category: true },
  });
}
