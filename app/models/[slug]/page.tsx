import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Database, ExternalLink, GitCompare } from "lucide-react";
import { BenchmarkTable } from "@/components/models/benchmark-table";
import { ModelCard } from "@/components/models/model-card";
import { ProviderAvailability } from "@/components/models/provider-availability";
import { IllustrativeDataNote } from "@/components/models/provenance-note";
import { Tag } from "@/components/models/tag";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { buildCompareHref } from "@/lib/compare";
import { formatDate, formatPrice, formatTokenCount } from "@/lib/format";
import {
  getModelBySlug,
  getRelatedModels,
  type ModelDetail,
  type RelatedModel,
} from "@/lib/queries/models";
import { MODALITY_LABELS, MODEL_TYPE_LABELS } from "@/lib/schemas/model-search";

export const dynamic = "force-dynamic";

type ModelPageProps = { params: Promise<{ slug: string }> };

const verificationMeta: Record<
  ModelDetail["verificationStatus"],
  { label: string; variant: BadgeVariant }
> = {
  ILLUSTRATIVE: { label: "Illustrative data", variant: "warning" },
  UNVERIFIED: { label: "Unverified", variant: "outline" },
  VERIFIED: { label: "Verified", variant: "success" },
  STALE: { label: "Stale record", variant: "danger" },
};

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { slug } = await params;
  let model: ModelDetail | null;

  try {
    model = await getModelBySlug(slug);
  } catch {
    return { title: "Model" };
  }

  if (!model) {
    notFound();
  }

  return {
    title: model.name,
    description: `${model.name} by ${model.lab.name}: pricing, context window, provider availability, and illustrative benchmark scores.`,
  };
}

export default async function ModelDetailPage({ params }: ModelPageProps) {
  const { slug } = await params;

  let model: ModelDetail | null;

  try {
    model = await getModelBySlug(slug);
  } catch (error) {
    console.error(`Could not load model "${slug}". Is PostgreSQL running and seeded?`, error);

    return (
      <div className="mx-auto max-w-2xl py-6">
        <EmptyState
          icon={<Database className="size-5" />}
          title="Catalog unavailable"
          description="This model could not be loaded from PostgreSQL. Check that the database is running and seeded, then reload."
          action={<ButtonLink href="/models">Back to models</ButtonLink>}
        />
      </div>
    );
  }

  if (!model) {
    notFound();
  }

  let relatedModels: RelatedModel[] = [];

  try {
    relatedModels = await getRelatedModels(model);
  } catch (error) {
    console.error(`Could not load related models for "${slug}".`, error);
  }

  const availableProviderCount = model.providers.filter((provider) => provider.isAvailable).length;
  const verification = verificationMeta[model.verificationStatus];
  const stats = [
    { label: "Input price (USD / 1M)", value: formatPrice(model.inputPricePerMTokUsd) },
    { label: "Output price (USD / 1M)", value: formatPrice(model.outputPricePerMTokUsd) },
    { label: "Context window", value: `${formatTokenCount(model.contextWindow)} tokens` },
    {
      label: "Max output",
      value: model.maxOutputTokens ? `${formatTokenCount(model.maxOutputTokens)} tokens` : "Not stated",
    },
    { label: "Released", value: formatDate(model.releaseDate) },
    { label: "Knowledge cutoff", value: model.knowledgeCutoff ?? "Not stated" },
  ];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/models" className="transition-colors hover:text-foreground">
              Models
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <span aria-current="page" className="text-foreground">
              {model.name}
            </span>
          </li>
        </ol>
      </nav>

      <header>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              <Link
                href={`/labs/${model.lab.slug}`}
                className="transition-colors hover:text-primary-strong"
              >
                {model.lab.name}
              </Link>
              <span aria-hidden="true" className="text-muted">
                /
              </span>
              <span className="text-muted">{model.license}</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {model.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{model.description}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <Tag>{MODEL_TYPE_LABELS[model.modelType]}</Tag>
              {model.modalities.map((modality) => (
                <Tag key={modality}>{MODALITY_LABELS[modality]}</Tag>
              ))}
              {model.isOpenWeights ? <Tag tone="primary">Open weights</Tag> : <Tag>Proprietary weights</Tag>}
              <Tag>
                {availableProviderCount} available provider{availableProviderCount === 1 ? "" : "s"}
              </Tag>
              <Badge variant={verification.variant}>{verification.label}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
            <ButtonLink
              href={buildCompareHref([model.slug])}
              variant="primary"
              className="lg:min-w-44"
            >
              <GitCompare className="size-4" aria-hidden="true" />
              Compare this model
            </ButtonLink>
            <ButtonLink href={`/api/models/${model.slug}`} variant="secondary">
              View JSON API
            </ButtonLink>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          <a
            href={model.lab.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Lab website
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          {model.sourceUrl ? (
            <a
              href={model.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              Source
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </header>

      <section aria-labelledby="model-facts-heading">
        <h2 id="model-facts-heading" className="sr-only">
          Model facts
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface px-4 py-4">
              <dt className="text-[10px] uppercase leading-4 tracking-[0.1em] text-muted">
                {stat.label}
              </dt>
              <dd className="mt-1 text-sm font-medium tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs leading-5 text-muted">
          Prices are US dollars per 1,000,000 tokens, not per request. Output price can be $0 for
          embedding-only models. Provider-specific rates may differ; see the availability section.
        </p>
      </section>

      <IllustrativeDataNote
        lastUpdated={model.lastUpdated}
        sourceUrl={model.sourceUrl ?? undefined}
        dataSource={model.dataSource}
      />

      <section
        aria-labelledby="capabilities-heading"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="capabilities-heading" className="text-base font-semibold">
            Capabilities and modalities
          </h2>
          <span className="text-xs text-muted">
            {model.capabilities.length} capabilit{model.capabilities.length === 1 ? "y" : "ies"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-6 text-muted">
          Modalities describe the inputs the model accepts. Capabilities describe recorded product
          features; they are not quality claims.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Input modalities:</span>
          {model.modalities.map((modality) => (
            <Tag key={modality}>{MODALITY_LABELS[modality]}</Tag>
          ))}
        </div>

        {model.capabilities.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {model.capabilities.map((capability) => (
              <li
                key={capability.slug}
                className="rounded-lg border border-border bg-background/40 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{capability.name}</h3>
                  <Tag>{capability.category}</Tag>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted">{capability.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">No normalized capabilities are recorded.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProviderAvailability
          providers={model.providers}
          listInputPrice={model.inputPricePerMTokUsd}
          listOutputPrice={model.outputPricePerMTokUsd}
        />
        <BenchmarkTable benchmarks={model.benchmarks} />
      </div>

      <section aria-labelledby="lab-heading" className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="lab-heading" className="text-base font-semibold">
            About {model.lab.name}
          </h2>
          <Link
            href={`/labs/${model.lab.slug}`}
            className="text-xs font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            View lab profile
          </Link>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">{model.lab.description}</p>
        <p className="mt-3 text-xs text-muted">
          {[model.lab.country, model.lab.foundedYear ? `Founded ${model.lab.foundedYear}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </section>

      {relatedModels.length > 0 ? (
        <section aria-labelledby="related-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="related-heading" className="text-base font-semibold tracking-tight">
                Related models
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                Same lab, or the same model type with a shared capability. Newest first; no
                synthetic recommendations.
              </p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedModels.map((related) => (
              <li key={related.slug}>
                <div className="mb-1.5">
                  <Tag tone={related.relation === "Same lab" ? "primary" : "neutral"}>
                    {related.relation}
                  </Tag>
                </div>
                <ModelCard model={related} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        href="/models"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:border-border-strong hover:bg-surface-raised"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the catalog
      </Link>
    </div>
  );
}
