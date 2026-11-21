import type { Metadata } from "next";
import { Suspense } from "react";
import { ModelExplorer } from "@/components/models/model-explorer";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Model catalog",
  description:
    "Search and filter AI models by lab, provider, type, capability, modality, open weights, input price, context window, and release date.",
};

function ExplorerFallback() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the model catalog…</span>
      <Skeleton className="h-56 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Models"
        description="Search, filter, sort, and compare every model in the seeded catalogue. Interactive controls fetch the JSON API and keep their state in the URL."
        actions={<ButtonLink href="/api/models">JSON API</ButtonLink>}
      />

      <Suspense fallback={<ExplorerFallback />}>
        <ModelExplorer />
      </Suspense>
    </div>
  );
}
