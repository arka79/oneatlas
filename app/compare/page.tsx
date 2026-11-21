import type { Metadata } from "next";
import { Database, GitCompare } from "lucide-react";
import { BenchmarkCompare } from "@/components/compare/benchmark-compare";
import { CapabilityCompare } from "@/components/compare/capability-compare";
import { CompareTable } from "@/components/compare/compare-table";
import {
  CompareToolbar,
  type CompareOption,
  type CompareSelection,
} from "@/components/compare/compare-toolbar";
import { CostEstimator } from "@/components/compare/cost-estimator";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { buildCatalogCompareHref } from "@/lib/compare";
import { getModelsBySlugs, listModels, type ModelDetail } from "@/lib/queries/models";
import { COMPARE_MIN_MODELS, parseCompareIds } from "@/lib/schemas/compare";
import { DEFAULT_MODEL_SEARCH } from "@/lib/schemas/model-search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare",
  description:
    "Compare two to four AI models side by side on list pricing, context windows, providers, modalities, capabilities, and illustrative benchmark scores, with a token cost estimator.",
};

/** The seeded catalogue has 50 models; this fills the compact picker. */
const PICKER_PAGE_SIZE = 50;

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  const ids = parseCompareIds((await searchParams).ids);

  let models: ModelDetail[] = [];
  let missing: string[] = [];
  let databaseUnavailable = false;

  if (ids.length > 0) {
    try {
      const result = await getModelsBySlugs(ids);
      models = result.models;
      missing = result.missing;
    } catch (error) {
      console.error("Could not load models for the compare page.", error);
      databaseUnavailable = true;
    }
  }

  let options: CompareOption[] = [];

  if (!databaseUnavailable) {
    try {
      const catalog = await listModels({
        ...DEFAULT_MODEL_SEARCH,
        page: 1,
        pageSize: PICKER_PAGE_SIZE,
        sort: "name-asc",
      });
      options = catalog.data.map((model) => ({
        slug: model.slug,
        name: model.name,
        lab: model.lab.name,
      }));
    } catch (error) {
      console.error("Could not load the compare model picker options.", error);
    }
  }

  const selected: CompareSelection[] = models.map(({ slug, name }) => ({ slug, name }));
  const lastUpdated = models.reduce(
    (latest, model) => (model.lastUpdated > latest ? model.lastUpdated : latest),
    models[0]?.lastUpdated ?? "",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compare"
        title="Compare models"
        description="Side-by-side list pricing, context windows, providers, modalities, capabilities, and illustrative benchmark scores for two to four models. The selection lives in the URL, so you can share or bookmark a comparison."
        actions={<ButtonLink href={buildCatalogCompareHref(ids)}>Browse catalogue</ButtonLink>}
      />

      {databaseUnavailable ? (
        <EmptyState
          icon={<Database className="size-5" />}
          title="Comparison unavailable"
          description="The selected models could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
          action={<ButtonLink href="/models">Back to models</ButtonLink>}
        />
      ) : (
        <>
          {missing.length > 0 ? (
            <Alert tone="warning" title="Some models in this link were not found">
              <p>
                No catalogue entries match{" "}
                {missing.map((slug, index) => (
                  <span key={slug}>
                    {index > 0 ? ", " : ""}
                    <code className="rounded bg-background px-1 py-0.5 font-mono text-[11px] text-foreground">
                      {slug}
                    </code>
                  </span>
                ))}
                .{" "}
                {models.length > 0
                  ? "The rest of the selection is shown below."
                  : "Add models with the picker below."}
              </p>
            </Alert>
          ) : null}

          <CompareToolbar selected={selected} options={options} />

          {models.length < COMPARE_MIN_MODELS ? (
            <EmptyState
              icon={<GitCompare className="size-5" />}
              title={
                models.length === 0 ? "Select two to four models" : "Add one more model to compare"
              }
              description={
                models.length === 0
                  ? "Use the picker above, or browse the catalogue and tick the comparison checkboxes. Your selection is kept in the URL while you navigate."
                  : `${models[0].name} is ready. Add one more model above to unlock the specification, benchmark, capability, and cost comparisons.`
              }
              action={
                <>
                  <ButtonLink href={buildCatalogCompareHref(ids)} variant="primary">
                    Browse the catalogue
                  </ButtonLink>
                  {models.length === 1 ? (
                    <ButtonLink href={`/models/${models[0].slug}`}>
                      View {models[0].name}
                    </ButtonLink>
                  ) : null}
                </>
              }
            />
          ) : (
            <>
              <CompareTable models={models} />
              <BenchmarkCompare models={models} />
              <CapabilityCompare models={models} />
              <CostEstimator models={models} />
              <IllustrativeDataNote
                lastUpdated={lastUpdated || undefined}
                dataSource={models[0].dataSource}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
